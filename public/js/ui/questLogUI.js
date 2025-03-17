import QuestManager from '../core/questManager.js';

export default class QuestLogUI {
    constructor() {
        this.questLog = document.getElementById('questLog');
        this.content = document.getElementById('questLogContent');
        this.toggleButton = document.getElementById('toggleQuestLog');
        this.closeButton = document.getElementById('closeQuestLog');
        this.currentTab = 'active';
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Toggle button
        this.toggleButton.addEventListener('click', () => this.toggle());
        
        // Close button
        this.closeButton.addEventListener('click', () => this.hide());
        
        // Tab switching
        document.querySelectorAll('.quest-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Keyboard shortcut (Q)
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'q' && !e.ctrlKey && !e.metaKey) {
                this.toggle();
            }
        });
    }

    show() {
        this.questLog.classList.add('show');
        this.refresh();
    }

    hide() {
        this.questLog.classList.remove('show');
    }

    toggle() {
        this.questLog.classList.toggle('show');
        if (this.questLog.classList.contains('show')) {
            this.refresh();
        }
    }

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.quest-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        this.refresh();
    }

    refresh() {
        this.content.innerHTML = '';
        
        const quests = this.currentTab === 'active' 
            ? QuestManager.getActiveQuests()
            : Array.from(QuestManager.completedQuests.values());

        if (quests.length === 0) {
            const emptyMessage = this.currentTab === 'active' 
                ? 'No active quests. Talk to NPCs to find quests!' 
                : 'No completed quests yet.';
            
            this.content.innerHTML = `<div class="no-quests">${emptyMessage}</div>`;
            return;
        }

        quests.forEach(quest => {
            const questElement = document.createElement('div');
            questElement.className = 'quest-entry';
            questElement.innerHTML = `
                <div class="quest-title">${quest.title}</div>
                <div class="quest-description">${quest.description}</div>
                <ul class="quest-objectives">
                    ${quest.objectives.map(obj => `
                        <li class="quest-objective ${obj.completed ? 'completed' : ''}">
                            <span>${obj.description}</span>
                            <span>${obj.current}/${obj.required}</span>
                        </li>
                    `).join('')}
                </ul>
                <div class="quest-rewards">
                    Rewards: ${Object.entries(quest.rewards).map(([key, value]) => 
                        `${value} ${key}`
                    ).join(', ')}
                </div>
            `;
            this.content.appendChild(questElement);
        });
    }
}