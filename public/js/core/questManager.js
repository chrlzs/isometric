import Quest from './quest.js';

export default class QuestManager {
    static quests = new Map();
    static activeQuests = new Map();
    static completedQuests = new Map();
    static listeners = new Set();

    static initialize() {
        // Initialize with some sample quests
        this.registerQuest(new Quest(
            'gather_herbs',
            'Gathering Herbs',
            'The village elder needs medicinal herbs. Collect 5 herbs from the garden.',
            [
                { id: 'herbs', description: 'Collect herbs', required: 5, current: 0 }
            ],
            { gold: 100, exp: 50 }
        ));

        this.registerQuest(new Quest(
            'clear_enemies',
            'Clear the Path',
            'Dangerous enemies are blocking the trade route. Clear them out.',
            [
                { id: 'enemies', description: 'Defeat enemies', required: 3, current: 0 }
            ],
            { gold: 200, exp: 100 }
        ));
    }

    static registerQuest(quest) {
        this.quests.set(quest.id, quest);
    }

    static startQuest(questId) {
        const quest = this.quests.get(questId);
        if (quest && quest.status === 'AVAILABLE') {
            quest.start();
            this.activeQuests.set(questId, quest);
            return true;
        }
        return false;
    }

    static addListener(callback) {
        this.listeners.add(callback);
    }

    static removeListener(callback) {
        this.listeners.delete(callback);
    }

    static notifyListeners() {
        this.listeners.forEach(callback => callback());
    }

    static updateObjective(questId, objectiveId, progress) {
        const result = super.updateObjective(questId, objectiveId, progress);
        if (result) {
            this.notifyListeners();
        }
        return result;
    }

    static getQuestStatus(questId) {
        return this.quests.get(questId)?.status || null;
    }

    static getActiveQuests() {
        return Array.from(this.activeQuests.values());
    }

    static updateQuestProgress(questId, objectiveId, amount) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return false;

        const objective = quest.objectives.find(obj => obj.id === objectiveId);
        if (!objective) return false;

        objective.current = Math.min(objective.current + amount, objective.required);
        
        // Check if objective is completed
        if (objective.current >= objective.required) {
            objective.completed = true;
        }

        // Check if all objectives are completed
        if (quest.objectives.every(obj => obj.completed)) {
            this.completeQuest(questId);
        }

        this.notifyListeners();
        return true;
    }

    static completeQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return false;

        quest.complete();
        this.activeQuests.delete(questId);
        this.completedQuests.set(questId, quest);
        
        // Trigger completion effects
        this.grantRewards(quest);
        this.showQuestCompleteNotification(quest);
        return true;
    }

    static grantRewards(quest) {
        // Implementation depends on your game's systems
        console.log(`Granting rewards: ${JSON.stringify(quest.rewards)}`);
        // Example: player.addGold(quest.rewards.gold);
        // Example: player.addExperience(quest.rewards.exp);
    }

    static showQuestCompleteNotification(quest) {
        const notification = document.createElement('div');
        notification.className = 'quest-notification';
        notification.innerHTML = `
            <h3>Quest Completed!</h3>
            <p>${quest.title}</p>
            <div class="rewards">
                Rewards: ${Object.entries(quest.rewards).map(([key, value]) => 
                    `${value} ${key}`
                ).join(', ')}
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }
}
