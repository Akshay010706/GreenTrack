class Database {
    constructor() {
        console.log('Database constructor');
        this.init();
    }

    init() {
        console.log('Database init');
        if (!localStorage.getItem('greentrack_initialized')) {
            console.log('Seeding users');
            this.seedUsers();
            localStorage.setItem('greentrack_initialized', 'true');
        }
    }

    seedUsers() {
        console.log('seedUsers called');
        // Seed users
        const users = [
            {
                id: 'admin-1',
                role: 'admin',
                name: 'Admin User',
                email: 'admin@demo',
                password: '1234',
                points: 0,
                trained: false
            },
            {
                id: 'worker-1',
                role: 'worker',
                name: 'Worker User',
                email: 'worker@demo',
                password: '1234',
                points: 0,
                trained: false
            },
            {
                id: 'citizen-1',
                role: 'citizen',
                name: 'Citizen User',
                email: 'citizen@demo',
                password: '1234',
                points: 50,
                trained: true
            }
        ];
        localStorage.setItem('users', JSON.stringify(users));
    }

    getAll(collection) {
        console.log(`getAll ${collection}`);
        const data = localStorage.getItem(collection);
        return data ? JSON.parse(data) : [];
    }

    add(collection, item) {
        const items = this.getAll(collection);
        item.id = item.id || this.generateId();
        items.push(item);
        localStorage.setItem(collection, JSON.stringify(items));
        return item;
    }

    updateById(collection, id, updates) {
        const items = this.getAll(collection);
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            localStorage.setItem(collection, JSON.stringify(items));
            return items[index];
        }
        return null;
    }

    remove(collection, id) {
        const items = this.getAll(collection);
        const filtered = items.filter(item => item.id !== id);
        localStorage.setItem(collection, JSON.stringify(filtered));
        return true;
    }

    findById(collection, id) {
        const items = this.getAll(collection);
        return items.find(item => item.id === id);
    }

    findBy(collection, predicate) {
        const items = this.getAll(collection);
        return items.filter(predicate);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    exportData() {
        const data = {};
        ['users', 'reports', 'facilities', 'trainingProgress'].forEach(collection => {
            data[collection] = this.getAll(collection);
        });
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            Object.keys(data).forEach(collection => {
                localStorage.setItem(collection, JSON.stringify(data[collection]));
            });
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }
}

const db = new Database();
export { db };
