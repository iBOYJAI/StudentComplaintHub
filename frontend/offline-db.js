// Offline Database Manager using IndexedDB
class OfflineDB {
    constructor() {
        this.dbName = 'ComplaintHubDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains('complaints')) {
                    const complaintStore = db.createObjectStore('complaints', { keyPath: 'id', autoIncrement: false });
                    complaintStore.createIndex('created_by', 'created_by', { unique: false });
                    complaintStore.createIndex('status', 'status', { unique: false });
                    complaintStore.createIndex('priority', 'priority', { unique: false });
                }

                if (!db.objectStoreNames.contains('comments')) {
                    const commentStore = db.createObjectStore('comments', { keyPath: 'id', autoIncrement: true });
                    commentStore.createIndex('complaint_id', 'complaint_id', { unique: false });
                    commentStore.createIndex('author_id', 'author_id', { unique: false });
                }

                if (!db.objectStoreNames.contains('likes')) {
                    const likeStore = db.createObjectStore('likes', { keyPath: ['complaint_id', 'user_id'], autoIncrement: false });
                    likeStore.createIndex('complaint_id', 'complaint_id', { unique: false });
                }

                if (!db.objectStoreNames.contains('bookmarks')) {
                    const bookmarkStore = db.createObjectStore('bookmarks', { keyPath: ['complaint_id', 'user_id'], autoIncrement: false });
                    bookmarkStore.createIndex('complaint_id', 'complaint_id', { unique: false });
                    bookmarkStore.createIndex('user_id', 'user_id', { unique: false });
                }

                if (!db.objectStoreNames.contains('follows')) {
                    const followStore = db.createObjectStore('follows', { keyPath: ['follower_id', 'following_id'], autoIncrement: false });
                    followStore.createIndex('follower_id', 'follower_id', { unique: false });
                    followStore.createIndex('following_id', 'following_id', { unique: false });
                }

                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: false });
                    userStore.createIndex('username', 'username', { unique: true });
                }

                if (!db.objectStoreNames.contains('pending_actions')) {
                    const pendingStore = db.createObjectStore('pending_actions', { keyPath: 'id', autoIncrement: true });
                    pendingStore.createIndex('type', 'type', { unique: false });
                    pendingStore.createIndex('status', 'status', { unique: false });
                }
            };
        });
    }

    // Complaint operations
    async saveComplaint(complaint) {
        const tx = this.db.transaction(['complaints'], 'readwrite');
        return tx.objectStore('complaints').put(complaint);
    }

    async getComplaints(filters = {}) {
        const tx = this.db.transaction(['complaints'], 'readonly');
        const store = tx.objectStore('complaints');
        const complaints = await store.getAll();
        
        // Apply filters
        let filtered = complaints;
        if (filters.created_by) {
            filtered = filtered.filter(c => c.created_by === filters.created_by);
        }
        if (filters.status) {
            filtered = filtered.filter(c => c.status === filters.status);
        }
        return filtered;
    }

    async getComplaint(id) {
        const tx = this.db.transaction(['complaints'], 'readonly');
        return tx.objectStore('complaints').get(id);
    }

    async deleteComplaint(id) {
        const tx = this.db.transaction(['complaints'], 'readwrite');
        return tx.objectStore('complaints').delete(id);
    }

    // Comment operations
    async saveComment(comment) {
        const tx = this.db.transaction(['comments'], 'readwrite');
        if (!comment.id) {
            comment.id = Date.now(); // Temporary ID
        }
        return tx.objectStore('comments').put(comment);
    }

    async getComments(complaintId) {
        const tx = this.db.transaction(['comments'], 'readonly');
        const index = tx.objectStore('comments').index('complaint_id');
        return index.getAll(complaintId);
    }

    // Like operations
    async toggleLike(complaintId, userId) {
        const tx = this.db.transaction(['likes'], 'readwrite');
        const store = tx.objectStore('likes');
        const key = [complaintId, userId];
        const existing = await store.get(key);
        
        if (existing) {
            await store.delete(key);
            return { liked: false };
        } else {
            await store.put({ complaint_id: complaintId, user_id: userId, created_at: new Date().toISOString() });
            return { liked: true };
        }
    }

    async isLiked(complaintId, userId) {
        const tx = this.db.transaction(['likes'], 'readonly');
        const store = tx.objectStore('likes');
        const key = [complaintId, userId];
        const result = await store.get(key);
        return !!result;
    }

    async getLikeCount(complaintId) {
        const tx = this.db.transaction(['likes'], 'readonly');
        const index = tx.objectStore('likes').index('complaint_id');
        const likes = await index.getAll(complaintId);
        return likes.length;
    }

    // Bookmark operations
    async toggleBookmark(complaintId, userId) {
        const tx = this.db.transaction(['bookmarks'], 'readwrite');
        const store = tx.objectStore('bookmarks');
        const key = [complaintId, userId];
        const existing = await store.get(key);
        
        if (existing) {
            await store.delete(key);
            return { bookmarked: false };
        } else {
            await store.put({ complaint_id: complaintId, user_id: userId, created_at: new Date().toISOString() });
            return { bookmarked: true };
        }
    }

    async isBookmarked(complaintId, userId) {
        const tx = this.db.transaction(['bookmarks'], 'readonly');
        const store = tx.objectStore('bookmarks');
        const key = [complaintId, userId];
        const result = await store.get(key);
        return !!result;
    }

    async getBookmarks(userId) {
        const tx = this.db.transaction(['bookmarks'], 'readonly');
        const index = tx.objectStore('bookmarks').index('user_id');
        // Note: We need to filter manually since we're using composite key
        const all = await tx.objectStore('bookmarks').getAll();
        return all.filter(b => b.user_id === userId);
    }

    // Follow operations
    async toggleFollow(followerId, followingId) {
        const tx = this.db.transaction(['follows'], 'readwrite');
        const store = tx.objectStore('follows');
        const key = [followerId, followingId];
        const existing = await store.get(key);
        
        if (existing) {
            await store.delete(key);
            return { following: false };
        } else {
            await store.put({ follower_id: followerId, following_id: followingId, created_at: new Date().toISOString() });
            return { following: true };
        }
    }

    async getFollowers(userId) {
        const tx = this.db.transaction(['follows'], 'readonly');
        const index = tx.objectStore('follows').index('following_id');
        return index.getAll(userId);
    }

    async getFollowing(userId) {
        const tx = this.db.transaction(['follows'], 'readonly');
        const index = tx.objectStore('follows').index('follower_id');
        return index.getAll(userId);
    }

    async isFollowing(followerId, followingId) {
        const tx = this.db.transaction(['follows'], 'readonly');
        const store = tx.objectStore('follows');
        const key = [followerId, followingId];
        const result = await store.get(key);
        return !!result;
    }

    // User operations
    async saveUser(user) {
        const tx = this.db.transaction(['users'], 'readwrite');
        return tx.objectStore('users').put(user);
    }

    async getUser(userId) {
        const tx = this.db.transaction(['users'], 'readonly');
        return tx.objectStore('users').get(userId);
    }

    // Pending actions (for sync when online)
    async addPendingAction(action) {
        const tx = this.db.transaction(['pending_actions'], 'readwrite');
        action.status = 'pending';
        action.created_at = new Date().toISOString();
        return tx.objectStore('pending_actions').add(action);
    }

    async getPendingActions() {
        const tx = this.db.transaction(['pending_actions'], 'readonly');
        return tx.objectStore('pending_actions').getAll();
    }

    async removePendingAction(id) {
        const tx = this.db.transaction(['pending_actions'], 'readwrite');
        return tx.objectStore('pending_actions').delete(id);
    }
}

// Initialize global instance
const offlineDB = new OfflineDB();
if ('indexedDB' in window) {
    offlineDB.init().catch(() => {
        // Silently fail - app will work without offline storage
    });
}

