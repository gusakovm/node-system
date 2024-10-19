const EnvManager = {
    categories: [],
    envVars: [],
    showMessage: null,

    async init(showMessageFunc) {
        this.showMessage = showMessageFunc;
        try {
            await this.fetchFullEnvList();
        } catch (error) {
            console.error('Error during initialization:', error);
            if (this.showMessage) {
                this.showMessage(-1, 'Error loading environment variables');
            }
        }
        this.renderCategoriesList();
    },

    async fetchFullEnvList() {
        const token = localStorage.getItem('nodeAPPToken');
        try {
            const response = await fetch(`${window.nodeAppBaseURL}/node-system/env-list-edit`, {
                headers: {
                    'nodeAPPToken': token
                }
            });
            if (response.ok) {
                const data = await response.json();
                this.envVars = Array.isArray(data) ? data : [];
                this.categories = [...new Set(this.envVars.map(item => item.category))];
            } else {
                throw new Error('Response from server is not OK');
            }
        } catch (error) {
            console.error('Error requesting full list of variables:', error);
            this.envVars = [];
            this.categories = [];
            if (this.showMessage) {
                this.showMessage(-1, 'Failed to load environment variables');
            }
        }
    },

    renderCategoriesList() {
        const envContainer = document.getElementById('env-manager');
        if (!envContainer) {
            console.error('Element env-manager not found');
            return;
        }
        envContainer.innerHTML = '';

        const addButton = document.createElement('button');
        addButton.textContent = 'Create new';
        addButton.className = 'mb-6 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-200';
        addButton.addEventListener('click', () => this.showAddForm());
        envContainer.appendChild(addButton);

        if (this.categories.length === 0) {
            const noVarsMessage = document.createElement('p');
            noVarsMessage.textContent = 'No environment variables available or an error occurred while loading them.';
            noVarsMessage.className = 'text-gray-400 mt-4';
            envContainer.appendChild(noVarsMessage);
            return;
        }

        this.categories.forEach((category, index) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'mb-6 bg-dark-300 rounded-lg shadow-lg overflow-hidden border border-gray-700';
            categoryDiv.innerHTML = `
                <div class="p-3 cursor-pointer flex items-center bg-gradient-to-r from-dark-400 to-dark-500">
                    <span class="toggle-icon mr-2 text-gray-400">▼</span>
                    <h3 class="text-lg font-bold text-white flex-grow">${category}</h3>
                </div>
                <div class="category-content p-3" style="display: none;"></div>
            `;
            
            const toggleHeader = categoryDiv.querySelector('.bg-gradient-to-r');
            const toggleIcon = categoryDiv.querySelector('.toggle-icon');
            const categoryContent = categoryDiv.querySelector('.category-content');
            
            toggleHeader.addEventListener('click', () => {
                categoryContent.style.display = categoryContent.style.display === 'none' ? 'block' : 'none';
                toggleIcon.textContent = categoryContent.style.display === 'none' ? '▼' : '▲';
            });

            const categoryVars = this.envVars.filter(item => item.category === category);
            categoryVars.forEach(envVar => {
                const envVarDiv = document.createElement('div');
                envVarDiv.className = 'mb-2 p-2 bg-dark-200 rounded-md hover:bg-dark-100 transition-colors duration-200';
                envVarDiv.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-gray-200 cursor-pointer" data-copy="${envVar.key}">${envVar.key}</span>
                        <button class="edit-btn text-blue-400 hover:text-blue-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </button>
                    </div>
                    <div class="text-gray-300 cursor-pointer" data-copy="${envVar.value}">${envVar.value}</div>
                    ${envVar.description ? `<div class="text-sm text-gray-400">${envVar.description}</div>` : ''}
                `;
                
                const editBtn = envVarDiv.querySelector('.edit-btn');
                editBtn.addEventListener('click', () => this.showEditForm(envVar));
                
                const copyElements = envVarDiv.querySelectorAll('[data-copy]');
                copyElements.forEach(el => {
                    el.addEventListener('click', () => this.copyToClipboard(el.getAttribute('data-copy')));
                });
                
                categoryContent.appendChild(envVarDiv);
            });

            envContainer.appendChild(categoryDiv);
        });
    },

    showEditForm(envVar) {
        const envContainer = document.getElementById('env-manager');
        if (!envContainer) {
            console.error('Element env-manager not found');
            return;
        }
        const form = document.createElement('div');
        form.className = 'mb-4 p-4 bg-dark-100 rounded';
        form.innerHTML = `
            <h3 class="text-lg font-bold mb-2 text-white">Edit variable</h3>
            <p class="mb-2 text-white">Category: ${envVar.category}</p>
            <p class="mb-2 text-white">Key: ${envVar.key}</p>
            <input id="editValue" type="text" value="${envVar.value}" class="w-full p-2 mb-2 rounded bg-dark-200 text-white">
            <textarea id="editDescription" class="w-full p-2 mb-2 rounded bg-dark-200 text-white">${envVar.description || ''}</textarea>
            <div class="flex justify-between items-center">
                <div>
                    <button id="saveEditButton" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">Save</button>
                    <button id="cancelEditButton" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded ml-2">Cancel</button>
                </div>
                <button id="removeButton" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">Remove</button>
            </div>
        `;
        envContainer.innerHTML = '';
        envContainer.appendChild(form);

        document.getElementById('saveEditButton').addEventListener('click', () => this.saveEditedEnvVar(envVar));
        document.getElementById('cancelEditButton').addEventListener('click', () => this.renderCategoriesList());
        document.getElementById('removeButton').addEventListener('click', () => this.removeEnvVar(envVar));
    },

    async saveEditedEnvVar(envVar) {
        const newValue = document.getElementById('editValue').value;
        const newDescription = document.getElementById('editDescription').value;

        if (!newValue) {
            if (this.showMessage) {
                this.showMessage(-1, 'Value is required');
            }
            return;
        }

        const updatedEnvVar = {
            ...envVar,
            value: newValue,
            description: newDescription
        };

        const token = localStorage.getItem('nodeAPPToken');
        try {
            const response = await fetch(`${window.nodeAppBaseURL}/node-system/env-update-entry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'nodeAPPToken': token
                },
                body: JSON.stringify(updatedEnvVar)
            });
            const data = await response.json();
            if (data.result === 'OK') {
                if (this.showMessage) {
                    this.showMessage(1, 'Updated');
                }
                await this.fetchFullEnvList();
                this.renderCategoriesList();
            } else {
                if (this.showMessage) {
                    this.showMessage(-1, data.result || 'Error updating environment variable');
                }
            }
        } catch (error) {
            console.error('Error updating environment variable:', error);
            if (this.showMessage) {
                this.showMessage(-1, 'An error occurred while updating');
            }
        }
    },

    showConfirmDialog(message, onConfirm, onCancel) {
        const dialog = document.createElement('div');
        dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        dialog.innerHTML = `
            <div class="bg-dark-100 p-6 rounded-lg shadow-xl">
                <p class="text-white mb-4">${message}</p>
                <div class="flex justify-end">
                    <button id="confirmYes" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mr-2">Yes</button>
                    <button id="confirmNo" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">No</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        dialog.querySelector('#confirmYes').addEventListener('click', () => {
            onConfirm();
            document.body.removeChild(dialog);
        });

        dialog.querySelector('#confirmNo').addEventListener('click', () => {
            onCancel();
            document.body.removeChild(dialog);
        });
    },

    async removeEnvVar(envVar) {
        this.showConfirmDialog(
            'Are you sure you want to delete this variable?',
            async () => {
                const token = localStorage.getItem('nodeAPPToken');
                try {
                    const response = await fetch(`${window.nodeAppBaseURL}/node-system/env-remove-entry`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'nodeAPPToken': token
                        },
                        body: JSON.stringify({
                            category: envVar.category,
                            key: envVar.key
                        })
                    });
                    const data = await response.json();
                    if (data.success === true) {
                        if (this.showMessage) {
                            this.showMessage(1, 'Variable deleted');
                        }
                        await this.fetchFullEnvList();
                        this.renderCategoriesList();
                    } else {
                        if (this.showMessage) {
                            this.showMessage(-1, 'Error deleting environment variable');
                        }
                    }
                } catch (error) {
                    console.error('Error deleting environment variable:', error);
                    if (this.showMessage) {
                        this.showMessage(-1, 'An error occurred while deleting');
                    }
                }
            },
            () => {
                // Action on cancel
            }
        );
    },

    showAddForm() {
        const envContainer = document.getElementById('env-manager');
        if (!envContainer) {
            console.error('Element env-manager not found');
            return;
        }
        const form = document.createElement('div');
        form.className = 'mb-4 p-4 bg-dark-100 rounded';
        
        const hasCategories = Array.isArray(this.categories) && this.categories.length > 0;
        
        form.innerHTML = `
            <h3 class="text-lg font-bold mb-2 text-white">Create new variable</h3>
            ${hasCategories ? `
            <select id="category" class="w-full p-2 mb-2 rounded bg-dark-200 text-white">
                ${this.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                <option value="new">New category</option>
            </select>
            ` : ''}
            <input id="newCategory" type="text" placeholder="New category" class="w-full p-2 mb-2 rounded bg-dark-200 text-white" ${hasCategories ? 'style="display: none;"' : ''}>
            <input id="key" type="text" placeholder="Key" class="w-full p-2 mb-2 rounded bg-dark-200 text-white">
            <input id="value" type="text" placeholder="Value" class="w-full p-2 mb-2 rounded bg-dark-200 text-white">
            <textarea id="description" placeholder="Description" class="w-full p-2 mb-2 rounded bg-dark-200 text-white"></textarea>
            <button id="saveButton" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">Create</button>
            <button id="cancelButton" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded ml-2">Cancel</button>
        `;
        envContainer.innerHTML = '';
        envContainer.appendChild(form);

        if (hasCategories) {
            document.getElementById('category').addEventListener('change', (e) => {
                document.getElementById('newCategory').style.display = e.target.value === 'new' ? 'block' : 'none';
            });
        }

        document.getElementById('saveButton').addEventListener('click', () => this.saveEnvVar());
        document.getElementById('cancelButton').addEventListener('click', () => this.renderCategoriesList());
    },

    async saveEnvVar() {
        const categorySelect = document.getElementById('category');
        const newCategoryInput = document.getElementById('newCategory');
        const key = document.getElementById('key').value;
        const value = document.getElementById('value').value;
        const description = document.getElementById('description').value;

        let category;
        if (categorySelect && categorySelect.value !== 'new') {
            category = categorySelect.value;
        } else {
            category = newCategoryInput.value;
        }

        if (!category || !key || !value) {
            if (this.showMessage) {
                this.showMessage(-1, 'Category, key, and value are required');
            } else {
                console.error('Category, key, and value are required');
            }
            return;
        }

        const newEnvVar = {
            category,
            key,
            value,
            description
        };

        const token = localStorage.getItem('nodeAPPToken');
        try {
            const response = await fetch(`${window.nodeAppBaseURL}/node-system/env-add-entry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'nodeAPPToken': token
                },
                body: JSON.stringify(newEnvVar)
            });
            const data = await response.json();
            if (data.result === 'OK') {
                if (this.showMessage) {
                    this.showMessage(1, 'Variable added');
                }
                await this.fetchFullEnvList();
                this.renderCategoriesList();
            } else {
                if (this.showMessage) {
                    this.showMessage(-1, data.result || 'Error adding environment variable');
                } else {
                    console.error(data.result || 'Error adding environment variable');
                }
            }
        } catch (error) {
            console.error('Error saving environment variable:', error);
            if (this.showMessage) {
                this.showMessage(-1, 'An error occurred while saving');
            }
        }
    },

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            if (this.showMessage) {
                this.showMessage(1, 'Скопировано');
            }
        }).catch(err => {
            console.error('Ошибка при копировании: ', err);
            if (this.showMessage) {
                this.showMessage(-1, 'Ошибка при копировании');
            }
        });
    }
};

window.EnvManager = EnvManager;
