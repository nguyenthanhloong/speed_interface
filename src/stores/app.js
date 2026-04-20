import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
    state: () => ({
        isLoading: false,
        requestCount: 0,
    }),

    actions: {
        startLoading() {
            this.requestCount++;
            this.isLoading = true;
        },
        stopLoading() {
            if (this.requestCount > 0) {
                this.requestCount--;
            }
            if (this.requestCount === 0) {
                this.isLoading = false;
            }
        }
    }
});