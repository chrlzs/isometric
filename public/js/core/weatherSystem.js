import Debug from '../utils/debug.js';

class WeatherSystem {
    constructor() {
        this.currentWeather = 'clear';
        this.targetIntensity = 0;
        this.currentIntensity = 0;
        this.intensity = 0;
        this.weatherDuration = 200;
        this.transitionDuration = 2000; // 2 seconds transition
        this.isTransitioning = false;
        
        this.weatherTypes = ['clear', 'rain', 'snow', 'sandstorm'];
        this.weatherWeights = {
            clear: 0.2,
            rain: 0.5,
            snow: 0.15,
            sandstorm: 0.15
        };

        this.updateWeatherEffects();
    }

    // Add this new method for loading saved weather state
    setWeather(weatherType, intensityValue) {
        if (!this.weatherTypes.includes(weatherType)) {
            weatherType = 'clear';
        }
        
        this.currentWeather = weatherType;
        this.targetIntensity = Math.max(0, Math.min(1, intensityValue));
        this.currentIntensity = this.targetIntensity;
        this.intensity = this.targetIntensity;
        
        // Update visual effects
        this.updateWeatherEffects();
        
        // Clear any existing weather classes
        const stage = document.getElementById('stage');
        if (stage) {
            this.weatherTypes.forEach(type => {
                stage.classList.remove(`weather-${type}`);
            });
            if (weatherType !== 'clear') {
                stage.classList.add(`weather-${weatherType}`);
            }
        }
    }

    update() {
        this.weatherDuration--;
        
        // Handle intensity transition
        if (this.currentIntensity !== this.targetIntensity) {
            const step = (this.targetIntensity - this.currentIntensity) / 60; // Smooth over ~1 second at 60fps
            this.currentIntensity += step;
            this.intensity = this.currentIntensity;
            this.updateWeatherEffects();
        }
        
        if (this.weatherDuration <= 0) {
            this.changeWeather();
        }
    }

    changeWeather() {
        const previousWeather = this.currentWeather;
        const roll = Math.random();
        
        // Use weighted probability
        let cumulativeWeight = 0;
        for (const [weather, weight] of Object.entries(this.weatherWeights)) {
            cumulativeWeight += weight;
            if (roll < cumulativeWeight) {
                this.currentWeather = weather;
                break;
            }
        }
        
        // Random duration between 10 and 30 seconds
        this.weatherDuration = Math.floor(Math.random() * 200) + 100;
        
        // Set target intensity
        this.targetIntensity = this.currentWeather === 'rain' 
            ? Math.random() * 0.2 + 0.3  // 0.3 to 0.5 range
            : Math.random() * 0.3 + 0.2;  // 0.2 to 0.5 range

        // Only log if weather actually changed
        if (previousWeather !== this.currentWeather) {
            console.log(`🌡️ Weather changing: ${previousWeather} → ${this.currentWeather} (target intensity: ${this.targetIntensity.toFixed(2)})`);
            this.startWeatherTransition(previousWeather);
        }
    }

    startWeatherTransition(previousWeather) {
        const stage = document.getElementById('stage');
        if (!stage) return;

        // Add both weather classes during transition
        if (previousWeather !== 'clear') {
            stage.classList.add(`weather-${previousWeather}`);
        }
        if (this.currentWeather !== 'clear') {
            stage.classList.add(`weather-${this.currentWeather}`);
        }

        // Remove previous weather class after transition
        setTimeout(() => {
            if (previousWeather !== 'clear') {
                stage.classList.remove(`weather-${previousWeather}`);
            }
        }, this.transitionDuration);
    }

    updateWeatherEffects() {
        const stage = document.getElementById('stage');
        if (!stage) return;

        // Update intensity
        stage.style.setProperty('--weather-intensity', this.intensity);
        
        // Update ambient lighting
        const darknessLevel = 1 - (this.intensity * 0.2);
        stage.style.setProperty('--ambient-light', darknessLevel);

        // Ensure weather class is set
        if (this.currentWeather !== 'clear') {
            stage.classList.add(`weather-${this.currentWeather}`);
        }
    }

    // Method to check if weather is appropriate for current biome
    isWeatherAppropriate(biome) {
        switch (biome) {
            case 'desert':
                return ['clear', 'sandstorm'].includes(this.currentWeather);
            case 'tundra':
                return ['clear', 'snow'].includes(this.currentWeather);
            default:
                return ['clear', 'rain'].includes(this.currentWeather);
        }
    }
}

export default WeatherSystem;