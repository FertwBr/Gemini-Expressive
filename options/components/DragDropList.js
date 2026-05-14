/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Provides HTML5 native drag-and-drop reordering functionality for a list container.
 * Calculates drop coordinates based on element bounding boxes to determine whether an item
 * is being dragged above or below another list item, and triggers a callback upon successful drop.
 */
export class DragDropList {
    /**
     * Initializes the drag-and-drop instance on a specific container.
     * @param {HTMLElement} container - The wrapper element containing the draggable items.
     * @param {Function} onReorder - Callback executed with the original and target indexes after a drop event.
     */
    constructor(container, onReorder) {
        this.container = container;
        this.onReorder = onReorder;
        this.draggedItemIndex = null;

        this._initEvents();
    }

    /**
     * Attaches all native HTML5 drag events (dragstart, dragend, dragover, dragleave, drop)
     * to the container to handle styling and positional calculations dynamically.
     * @private
     * @returns {void}
     */
    _initEvents() {
        this.container.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.snippet-list-item');
            if (!item) return;

            this.draggedItemIndex = parseInt(item.dataset.index, 10);
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => item.classList.add('dragging'), 0);
        });

        this.container.addEventListener('dragend', (e) => {
            const item = e.target.closest('.snippet-list-item');
            if (item) item.classList.remove('dragging');
            this.draggedItemIndex = null;
        });

        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const draggingElement = this.container.querySelector('.dragging');
            const item = e.target.closest('.snippet-list-item');

            if (draggingElement && item && draggingElement !== item) {
                const bounding = item.getBoundingClientRect();
                const offset = bounding.y + (bounding.height / 2);
                if (e.clientY - offset > 0) {
                    item.style.borderBottom = '2px solid var(--md-sys-color-primary)';
                    item.style.borderTop = '';
                } else {
                    item.style.borderTop = '2px solid var(--md-sys-color-primary)';
                    item.style.borderBottom = '';
                }
            }
        });

        this.container.addEventListener('dragleave', (e) => {
            const item = e.target.closest('.snippet-list-item');
            if (item) {
                item.style.borderBottom = '';
                item.style.borderTop = '';
            }
        });

        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            const item = e.target.closest('.snippet-list-item');

            if (item) {
                item.style.borderBottom = '';
                item.style.borderTop = '';
            }

            if (this.draggedItemIndex === null || !item) return;

            const dropIndex = parseInt(item.dataset.index, 10);
            if (this.draggedItemIndex === dropIndex) return;

            const bounding = item.getBoundingClientRect();
            const offset = bounding.y + (bounding.height / 2);

            let finalDropIndex = dropIndex;
            if (e.clientY - offset > 0) {
                finalDropIndex = dropIndex + 1;
            }

            this.onReorder(this.draggedItemIndex, finalDropIndex);
        });
    }
}