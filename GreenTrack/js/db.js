class Database {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('greentrack_initialized')) {
            this.seedData();
            localStorage.setItem('greentrack_initialized', 'true');
        }
    }

    seedData() {
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

        // Seed facilities
        const facilities = [
            {
                id: 'facility-1',
                name: 'Green Recycling Center',
                type: 'recycling',
                lat: 26.8467,
                lng: 80.9462,
                address: '123 Hazratganj, Lucknow',
                hours: '9 AM - 6 PM'
            },
            {
                id: 'facility-2',
                name: 'Organic Compost Hub',
                type: 'compost',
                lat: 26.8500,
                lng: 80.9500,
                address: '456 Aminabad, Lucknow',
                hours: '8 AM - 5 PM'
            },
            {
                id: 'facility-3',
                name: 'Metal Scrap Shop',
                type: 'scrap',
                lat: 26.8400,
                lng: 80.9400,
                address: '789 Chowk, Lucknow',
                hours: '10 AM - 7 PM'
            }
        ];
        localStorage.setItem('facilities', JSON.stringify(facilities));

        // Initialize other data stores
        localStorage.setItem('reports', JSON.stringify([]));
        localStorage.setItem('trainingProgress', JSON.stringify([]));
    }

    getAll(collection) {
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
