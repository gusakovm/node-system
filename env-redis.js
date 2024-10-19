const EnvRedis = {
    envVars: {},

    async fetchEnvVars() {
        const token = localStorage.getItem('nodeAPPToken');
        try {
            const response = await fetch(`${window.nodeAppBaseURL}/node-system/env-list-view`, {
                headers: {
                    'nodeAPPToken': token
                }
            });
            if (response.ok) {
                this.envVars = await response.json();
                this.renderEnvVars();
            } else {
                console.error('Error fetching data from Redis:', response.status, response.statusText);
                this.renderError(`Error fetching data from Redis: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error requesting data from Redis:', error);
            this.renderError(`Error requesting data from Redis: ${error.message}`);
        }
    },

    renderEnvVars() {
        const envContainer = document.getElementById('env-redis');
        envContainer.innerHTML = '<h2 class="text-xl mb-4">Current variables tree</h2>';
        const preElement = document.createElement('pre');
        preElement.className = 'bg-dark-100 p-4 rounded overflow-auto';
        preElement.textContent = JSON.stringify(this.envVars, null, 2);
        envContainer.appendChild(preElement);
    },

    renderError(errorMessage) {
        const envContainer = document.getElementById('env-redis');
        envContainer.innerHTML = `<h2 class="text-xl mb-4">Error</h2><p class="text-red-500">${errorMessage}</p>`;
    }
};

window.EnvRedis = EnvRedis;
