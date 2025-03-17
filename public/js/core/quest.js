export default class Quest {
    constructor(id, title, description, objectives, rewards) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.objectives = objectives.map(obj => ({
            ...obj,
            completed: false
        }));
        this.rewards = rewards;
        this.status = 'AVAILABLE'; // AVAILABLE, ACTIVE, COMPLETED, FAILED
        this.dateStarted = null;
        this.dateCompleted = null;
    }

    start() {
        this.status = 'ACTIVE';
        this.dateStarted = new Date();
    }

    completeObjective(objectiveId) {
        const objective = this.objectives.find(obj => obj.id === objectiveId);
        if (objective) {
            objective.completed = true;
            this.checkCompletion();
        }
    }

    checkCompletion() {
        if (this.objectives.every(obj => obj.completed)) {
            this.complete();
        }
    }

    complete() {
        this.status = 'COMPLETED';
        this.dateCompleted = new Date();
    }

    fail() {
        this.status = 'FAILED';
    }
}