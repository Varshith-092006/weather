const apiKey = '0b4e519a23e25ef5601984bf6f4a9956';
const cityInput = document.getElementById('city');
const getWeatherBtn = document.querySelector('.get');
const locationBtn = document.querySelector('.location');
const refreshBtn = document.querySelector('.refresh');
const weatherIcon = document.querySelector('.weather-icon');
const tempElement = document.querySelector('.temp');
const descriptionElement = document.querySelector('.description');
const feelsLikeElement = document.querySelector('.feels-like');
const humidityElement = document.querySelector('.humidity');
const windElement = document.querySelector('.wind');
const errorElement = document.querySelector('.error-message');
const loadingElement = document.querySelector('.loading');
const unitButtons = document.querySelectorAll('.unit-btn');

let currentUnit = 'celsius';
let currentWeatherData = null;

// Weather emoji mapping
const weatherEmojis = {
    "Clear": "☀️",
    "Clouds": "☁️",
    "Rain": "🌧️",
    "Drizzle": "🌦️",
    "Thunderstorm": "⛈️",
    "Snow": "❄️",
    "Mist": "🌫️",
    "Fog": "🌁",
    "Smoke": "💨",
    "Haze": "😶‍🌫️",
    "Dust": "💨",
    "Sand": "🌪️",
    "Ash": "🌋",
    "Squall": "🌬️",
    "Tornado": "🌪️"
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Try to get weather for user's location on startup
    getLocationWeather();
    
    // Add event listeners
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            getCityWeather();
        }
    });
    
    getWeatherBtn.addEventListener('click', getCityWeather);
    locationBtn.addEventListener('click', getLocationWeather);
    refreshBtn.addEventListener('click', refreshWeather);
    
    // Unit toggle buttons
    unitButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            unitButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentUnit = btn.dataset.unit;
            if (currentWeatherData) {
                displayWeatherData(currentWeatherData);
            }
        });
    });
});

function showLoading() {
    loadingElement.style.display = 'block';
    errorElement.textContent = '';
    weatherIcon.textContent = '';
    tempElement.textContent = '';
    descriptionElement.textContent = '';
    feelsLikeElement.textContent = '';
    humidityElement.textContent = '';
    windElement.textContent = '';
}

function hideLoading() {
    loadingElement.style.display = 'none';
}

function showError(message) {
    errorElement.textContent = message;
    weatherIcon.textContent = '❌';
    tempElement.textContent = '';
    descriptionElement.textContent = '';
    feelsLikeElement.textContent = '';
    humidityElement.textContent = '';
    windElement.textContent = '';
}

function getWeatherEmoji(weatherMain) {
    return weatherEmojis[weatherMain] || "🌈";
}

function capitalize(str) {
    return str.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function convertTemp(kelvin, unit) {
    if (unit === 'celsius') {
        return Math.round(kelvin - 273.15);
    } else {
        return Math.round((kelvin - 273.15) * 9/5 + 32);
    }
}

function displayWeatherData(data) {
    currentWeatherData = data;
    
    const weatherMain = data.weather[0].main;
    const description = capitalize(data.weather[0].description);
    const temp = convertTemp(data.main.temp, currentUnit);
    const feelsLike = convertTemp(data.main.feels_like, currentUnit);
    const humidity = data.main.humidity;
    const windSpeed = (data.wind.speed * 3.6).toFixed(1); // Convert m/s to km/h
    
    weatherIcon.textContent = getWeatherEmoji(weatherMain);
    tempElement.textContent = `${temp}°${currentUnit === 'celsius' ? 'C' : 'F'}`;
    descriptionElement.textContent = description;
    feelsLikeElement.textContent = `${feelsLike}°${currentUnit === 'celsius' ? 'C' : 'F'}`;
    humidityElement.textContent = `${humidity}%`;
    windElement.textContent = `${windSpeed} km/h`;
    
    cityInput.value = data.name;
    errorElement.textContent = '';
}

async function fetchWeather(apiUrl) {
    showLoading();
    
    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found. Please check the spelling.');
            } else if (response.status === 401) {
                throw new Error('API key issue. Please try again later.');
            } else {
                throw new Error('Unable to fetch weather data.');
            }
        }
        
        const data = await response.json();
        displayWeatherData(data);
    } catch (error) {
        console.error("Error fetching weather data:", error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function getCityName(lat, lon) {
    const geoApiUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
    
    try {
        const response = await fetch(geoApiUrl);
        const data = await response.json();
        return data[0]?.name || null;
    } catch (error) {
        console.error("Error fetching city name:", error);
        return null;
    }
}

function getCityWeather() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
    fetchWeather(apiUrl);
}

function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                // Option 1: Directly use coordinates (more reliable)
                const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
                fetchWeather(apiUrl);
                
                // Option 2: Get city name first (might be more user-friendly)
                // const cityName = await getCityName(lat, lon);
                // if (cityName) {
                //     cityInput.value = cityName;
                //     getCityWeather();
                // } else {
                //     showError('Could not determine your location name');
                // }
            },
            (error) => {
                console.error("Geolocation error:", error);
                showError('Location access denied. Please enable location services or enter a city manually.');
            },
            { timeout: 10000 }
        );
    } else {
        showError('Geolocation is not supported by your browser');
    }
}

function refreshWeather() {
    if (currentWeatherData) {
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${currentWeatherData.name}&appid=${apiKey}`;
        fetchWeather(apiUrl);
    } else {
        getLocationWeather();
    }
}