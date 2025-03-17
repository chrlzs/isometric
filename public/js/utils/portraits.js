class Portraits {
    static CHARACTERS = {
        PLAYER: {
            name: 'Player',
            portrait: '/assets/portraits/player.png',
            portraitMood: {
                default: '/assets/portraits/player.png',
                happy: '/assets/portraits/player-happy.png',
                angry: '/assets/portraits/player-angry.png',
                surprised: '/assets/portraits/player-surprised.png'
            }
        },
        ELDER: {
            name: 'Village Elder',
            portrait: '/assets/portraits/elder.png',
            portraitMood: {
                default: '/assets/portraits/elder.png',
                happy: '/assets/portraits/elder-happy.png',
                stern: '/assets/portraits/elder-stern.png',
                worried: '/assets/portraits/elder-worried.png'
            }
        },
        MERCHANT: {
            name: 'Merchant',
            portrait: '/assets/portraits/merchant.png',
            portraitMood: {
                default: '/assets/portraits/merchant.png',
                happy: '/assets/portraits/merchant-happy.png',
                suspicious: '/assets/portraits/merchant-suspicious.png'
            }
        }
    };

    static getPortrait(character, mood = 'default') {
        const char = this.CHARACTERS[character];
        if (!char) return null;
        
        return char.portraitMood[mood] || char.portrait;
    }

    static getName(character) {
        return this.CHARACTERS[character]?.name || 'Unknown';
    }
}

export default Portraits;