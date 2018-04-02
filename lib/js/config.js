//requires 3 columns for individual scores in airtable (Score1, Score2, Score3)
// as well as 3 more columns: "readers", "comments", and "Unique Student ID"
// columns with "?" will be considered as essay questions

let airtable_base = "appp7JEOISSACpFWf"; // specific table (check API)
let table_name = "Readathon"; // specific tab in table by name
let table_view = "Grid view"; // specific view in tab by name
let scores = ["Score1","Score2","Score3"]; // column name of scores
let updateSecs = 60; // continually updates from db every updateSecs (in seconds)
let apiKey = "keyVIWCOZULuFuVKd" // be sure the change this after!

// hard coding questions string and key from airtable
let q_string = "Can you tell us about a time that you struggled with something? For example, a subject in school, a major assignment, or a personal project. What was challenging about it? What did you do?"
let q_key = "essay_raw";

// Particles.js
let particles_obj = {
    "particles": {
        "number": {
            "value": 30,
            "density": {
                "enable": true,
                "value_area": 800
            }
        },
        "color": {
            "value": "#FFDD00"
        },
        "shape": {
            "type": "star",
            "stroke": {
                "width": 0,
                "color": "#000000"
            },
            "polygon": {
                "nb_sides": 5
            }
        },
        "opacity": {
            "value": 0.5,
            "random": true,
            "anim": {
                "enable": false,
                "speed": 1,
                "opacity_min": 0.1,
                "sync": false
            }
        },
        "size": {
            "value": 10,
            "random": true,
            "anim": {
                "enable": false,
                "speed": 80,
                "size_min": 1,
                "sync": false
            }
        },
        "line_linked": {
            "enable": false,
            "distance": 300,
            "color": "#ffffff",
            "opacity": 0.4,
            "width": 2
        },
        "move": {
            "enable": true,
            "speed": .25,
            "direction": "top",
            "random": false,
            "straight": true,
            "out_mode": "out",
            "bounce": false,
            "attract": {
                "enable": false,
                "rotateX": 600,
                "rotateY": 1200
            }
        }
    },
    "interactivity": {
        "detect_on": "window",
        "events": {
            "onhover": {
                "enable": true,
                "mode": "bubble"
            },
            "onclick": {
                "enable": true,
                "mode": "push"
            },
            "resize": true
        },
        "modes": {
            "bubble": {
                "distance": 100,
                "size": 5,
                "duration": 2,
                "opacity": 0.8,
                "speed": 1
            },
            "push": {
                "particles_nb": 1
            }
        }
    },
    "retina_detect": false
}

particlesJS('particles-js', particles_obj);