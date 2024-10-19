const EnvMain = {
    async init() {
        console.log('Starting init() execution');
        this.showSpinner();
        const token = localStorage.getItem('nodeAPPToken');
        console.log('Token received:', token ? 'Token exists' : 'Token is missing');
        if (!token) {
            this.showAuth();
        } else {
            try {
                const isValid = await this.checkTokenValidity(token);
                if (isValid) {
                    const activeTab = localStorage.getItem('activeTab') || 'envTab';
                    if (activeTab === 'envTab') {
                        await this.showEnvManager();
                    } else {
                        await this.showEnvRedis();
                    }
                } else {
                    localStorage.removeItem('nodeAPPToken');
                    this.showAuth();
                }
            } catch (error) {
                console.error('Error during token check:', error);
                this.showAuth();
            }
        }
    },

    showSpinner() {
        document.getElementById('spinner').classList.remove('hidden');
        document.getElementById('auth').classList.add('hidden');
        document.getElementById('env-manager').classList.add('hidden');
        document.getElementById('env-redis').classList.add('hidden');
    },

    showAuth() {
        document.getElementById('spinner').classList.add('hidden');
        document.getElementById('auth').classList.remove('hidden');
        document.getElementById('env-manager').classList.add('hidden');
        document.getElementById('env-redis').classList.add('hidden');
    },

    setActiveTab(tabId) {
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');
        localStorage.setItem('activeTab', tabId);
    },

    async showEnvManager() {
        this.setActiveTab('envTab');
        document.getElementById('spinner').classList.add('hidden');
        document.getElementById('auth').classList.add('hidden');
        document.getElementById('env-manager').classList.remove('hidden');
        document.getElementById('env-redis').classList.add('hidden');
        if (!window.EnvManager) {
            console.error('EnvManager is not defined');
            this.showMessage(-1, 'Error: EnvManager is not loaded');
            return;
        }
        try {
            if (!window.envManager) {
                window.envManager = Object.create(window.EnvManager);
            }
            await window.envManager.init(this.showMessage);
        } catch (error) {
            console.error('Error initializing environment manager:', error);
            this.showMessage(-1, 'Error initializing environment manager');
            this.showAuth();
        }
    },

    async showEnvRedis() {
        this.setActiveTab('redisTab');
        document.getElementById('spinner').classList.add('hidden');
        document.getElementById('auth').classList.add('hidden');
        document.getElementById('env-manager').classList.add('hidden');
        document.getElementById('env-redis').classList.remove('hidden');
        try {
            await EnvRedis.fetchEnvVars();
        } catch (error) {
            console.error('Error loading Redis variables:', error);
            this.showAuth();
        }
    },

    async checkTokenValidity(token) {
        try {
            const response = await fetch(`${window.nodeAppBaseURL}node-system/auth-token-check`, {
                method: 'GET',
                headers: {
                    'nodeAPPToken': token
                }
            });
            return response.status === 200;
        } catch (error) {
            console.error('Error checking token validity:', error);
            return false;
        }
    },

    async setupEventListeners() {
        document.getElementById('authForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = document.getElementById('accessToken').value;
            this.showSpinner();
            const isAuthorized = await this.checkTokenValidity(token);
            if (isAuthorized) {
                localStorage.setItem('nodeAPPToken', token);
                this.showEnvManager();
            } else {
                alert('Invalid token. Please try again.');
                this.showAuth();
            }
        });

        document.getElementById('envTab').addEventListener('click', () => {
            this.showSpinner();
            this.showEnvManager();
        });
        document.getElementById('redisTab').addEventListener('click', () => {
            this.showSpinner();
            this.showEnvRedis();
        });
    },

    showMessage(status, text, duration = 3000) {
        const container = document.getElementById('message-container');
        const statusElement = document.getElementById('message-status');
        const textElement = document.getElementById('message-text');

        switch (status) {
            case 1:
                statusElement.className = 'w-3 h-3 rounded-full mr-2 bg-green-500';
                break;
            case 0:
                statusElement.className = 'w-3 h-3 rounded-full mr-2 bg-white';
                break;
            case -1:
                statusElement.className = 'w-3 h-3 rounded-full mr-2 bg-red-500';
                break;
        }

        textElement.textContent = text;

        container.classList.remove('hidden');

        setTimeout(() => {
            container.classList.add('hidden');
        }, duration);
    },

    exec() {
        console.log('DOMContentLoaded triggered');
        this.setupEventListeners();
        console.log('setupEventListeners executed');
        this.init().catch(error => {
            console.error('Error during initialization:', error);
            this.showAuth();
        });
        console.log('init() called');
    }
};

window.EnvMain = EnvMain;
