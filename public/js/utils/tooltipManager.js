import Debug from './debug.js';

class TooltipManager {
    constructor() {
        Debug.log('TOOLTIP', 'TooltipManager constructor called');
        this.tooltip = this.createTooltipElement();
        this.currentTarget = null;
        this.showDelay = 200;
        this.hideDelay = 100;
        this.showTimeout = null;
        this.hideTimeout = null;
        
        // Bind methods
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
    }

    createTooltipElement() {
        Debug.log('TOOLTIP', 'Creating tooltip element');
        const tooltip = document.createElement('div');
        tooltip.className = 'game-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);
        return tooltip;
    }

    init() {
        Debug.log('TOOLTIP', 'Initializing TooltipManager');
        const grid = document.querySelector('.grid');
        if (!grid) {
            Debug.error('Grid element not found');
            return;
        }

        grid.addEventListener('mousemove', this.handleMouseMove);
        
        // Add listeners to relevant cells
        this.addListenersToInteractiveElements();
    }

    addListenersToInteractiveElements() {
        const cells = document.querySelectorAll('.cell[class*="structure-"], .cell.npc, .cell.enemy');
        Debug.log('TOOLTIP', `Found ${cells.length} interactive elements`);
        cells.forEach(cell => {
            cell.addEventListener('mouseenter', this.handleMouseEnter);
            cell.addEventListener('mouseleave', this.handleMouseLeave);
        });
    }

    handleMouseMove(e) {
        if (!this.tooltip) return;
        
        // Position tooltip near cursor
        const offset = 15;
        let x = e.pageX + offset;
        let y = e.pageY + offset;

        // Keep tooltip within viewport
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (x + tooltipRect.width > viewportWidth) {
            x = e.pageX - tooltipRect.width - offset;
        }
        if (y + tooltipRect.height > viewportHeight) {
            y = e.pageY - tooltipRect.height - offset;
        }

        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
    }

    handleMouseEnter(e) {
        Debug.log('TOOLTIP', 'Mouse entered interactive element');
        clearTimeout(this.hideTimeout);
        
        const cell = e.target;
        this.currentTarget = cell;

        this.showTimeout = setTimeout(() => {
            const content = this.getTooltipContent(cell);
            if (content) {
                this.showTooltip(content);
            }
        }, this.showDelay);
    }

    handleMouseLeave() {
        clearTimeout(this.showTimeout);
        
        this.hideTimeout = setTimeout(() => {
            this.hideTooltip();
        }, this.hideDelay);
    }

    getTooltipContent(cell) {
        // Structure tooltips
        if (cell.classList.contains('structure-tavern')) {
            return {
                title: 'Tavern',
                description: 'A cozy place to rest and gather information',
                status: 'Open',
                details: ['Serves food and drinks', 'Meeting point for adventurers']
            };
        }
        if (cell.classList.contains('structure-market')) {
            return {
                title: 'Market',
                description: 'Buy and sell goods',
                status: 'Open for trading',
                details: ['Various merchants', 'Daily special offers']
            };
        }
        if (cell.classList.contains('structure-temple')) {
            return {
                title: 'Temple',
                description: 'A place of worship and healing',
                status: 'Peaceful',
                details: ['Offers healing services', 'Spiritual guidance']
            };
        }

        // NPC tooltips
        if (cell.classList.contains('npc')) {
            return {
                title: 'Village Elder',
                description: 'A wise advisor',
                status: 'Available for chat',
                details: ['Offers quests', 'Shares local knowledge']
            };
        }

        // Add enemy tooltips
        if (cell.classList.contains('enemy')) {
            return {
                title: 'Hostile Enemy',
                description: 'A dangerous foe',
                status: 'Aggressive',
                details: ['Threatens the area', 'Combat ready']
            };
        }

        return null;
    }

    showTooltip(content) {
        if (!content) return;

        this.tooltip.innerHTML = `
            <div class="tooltip-title">${content.title}</div>
            <div class="tooltip-description">${content.description}</div>
            <div class="tooltip-status">${content.status}</div>
            ${content.details ? `
                <ul class="tooltip-details">
                    ${content.details.map(detail => `<li>${detail}</li>`).join('')}
                </ul>
            ` : ''}
        `;

        this.tooltip.style.display = 'block';
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
        this.currentTarget = null;
    }

    // Call this when updating the grid
    refresh() {
        this.addListenersToInteractiveElements();
    }
}

export default TooltipManager;