class DayNightCycle {
    constructor() {
        this.time = 0; // 0-24 hours in game time
        this.dayLength = 1200; // 20 minutes real time = 1 day
        this.timeSpeed = 24 / this.dayLength; // Hours per frame at 60fps
        
        // Lighting thresholds (in game hours)
        this.times = {
            dawn: 5,    // Dawn starts
            sunrise: 6, // Sunrise
            noon: 12,   // Peak daylight
            sunset: 18, // Sunset starts
            dusk: 19,   // Dusk
            midnight: 0 // Darkest point
        };
        
        this.updateLighting();
    }

    update() {
        this.time = (this.time + this.timeSpeed) % 24;
        this.updateLighting();
    }

    updateLighting() {
        const stage = document.getElementById('stage');
        if (!stage) return;

        // Calculate base light level (0-1)
        let lightLevel = this.calculateLightLevel();
        
        // Apply weather effects to light level
        const weatherSystem = window.app?.weatherSystem;
        if (weatherSystem) {
            lightLevel *= (1 - (weatherSystem.intensity * 0.3));
        }

        // Update CSS variables
        stage.style.setProperty('--time-of-day', this.time);
        stage.style.setProperty('--light-level', lightLevel);
        
        // Update ambient color based on time of day
        const ambientColor = this.calculateAmbientColor(lightLevel);
        stage.style.setProperty('--ambient-color', ambientColor);
        
        // Add/remove time-of-day classes
        this.updateTimeClasses(stage);
    }

    calculateLightLevel() {
        const { dawn, sunrise, noon, sunset, dusk } = this.times;
        
        if (this.time >= dawn && this.time <= sunrise) {
            // Dawn transition
            return (this.time - dawn) / (sunrise - dawn) * 0.3 + 0.2;
        } else if (this.time > sunrise && this.time <= noon) {
            // Morning transition
            return (this.time - sunrise) / (noon - sunrise) * 0.4 + 0.5;
        } else if (this.time > noon && this.time <= sunset) {
            // Afternoon transition
            return 0.9 - (this.time - noon) / (sunset - noon) * 0.3;
        } else if (this.time > sunset && this.time <= dusk) {
            // Dusk transition
            return 0.6 - (this.time - sunset) / (dusk - sunset) * 0.4;
        } else {
            // Night
            return 0.2;
        }
    }

    calculateAmbientColor(lightLevel) {
        const { sunrise, noon, sunset, dusk } = this.times;
        
        if (this.time < sunrise) {
            // Pre-dawn (dark blue)
            return `rgb(20, 20, ${Math.floor(50 + lightLevel * 40)})`;
        } else if (this.time < noon) {
            // Morning (warm)
            return `rgb(${Math.floor(200 * lightLevel)}, ${Math.floor(180 * lightLevel)}, ${Math.floor(160 * lightLevel)})`;
        } else if (this.time < sunset) {
            // Afternoon (neutral)
            return `rgb(${Math.floor(255 * lightLevel)}, ${Math.floor(255 * lightLevel)}, ${Math.floor(255 * lightLevel)})`;
        } else if (this.time < dusk) {
            // Sunset (orange/red)
            return `rgb(${Math.floor(255 * lightLevel)}, ${Math.floor(150 * lightLevel)}, ${Math.floor(100 * lightLevel)})`;
        } else {
            // Night (dark blue)
            return `rgb(20, 20, ${Math.floor(50 + lightLevel * 40)})`;
        }
    }

    updateTimeClasses(stage) {
        // Remove all time classes
        stage.classList.remove('time-dawn', 'time-day', 'time-dusk', 'time-night');
        
        // Add appropriate time class
        if (this.time >= this.times.dawn && this.time < this.times.sunrise) {
            stage.classList.add('time-dawn');
        } else if (this.time >= this.times.sunrise && this.time < this.times.sunset) {
            stage.classList.add('time-day');
        } else if (this.time >= this.times.sunset && this.time < this.times.dusk) {
            stage.classList.add('time-dusk');
        } else {
            stage.classList.add('time-night');
        }
    }

    getTimeOfDayString() {
        const hours = Math.floor(this.time);
        const minutes = Math.floor((this.time % 1) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
}

export default DayNightCycle;