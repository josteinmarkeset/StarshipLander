# Starship Lander

Starship Lander is a rocket landing simulator. The user can control the rocket, and manipulate simulation variables
.
## Installation

1. Clone the repository

```bash
git clone https://github.com/josteinmarkeset/StarshipLander.git
```

2. Run the code with the http server of you choice. Example is using python's inbuilt http-server

```bash
python -m http.server
```

3. Open the webpage. Python's http-server defaults to [http://locahost:8000](http://locahost:8000)

## Usage

The controls for the rocket are **A** and **D** for turning, and **SPACE** for throttle.

In addition, you may change simulation variables by using the sliders on the top-left of the screen.

## For developers
![alt text][logo]

[logo]: https://github.com/josteinmarkeset/StarshipLander/raw/master/resources/img/class_diagram.jpg "Class Diagram"

The code is structured in various classes. The main class is **World**. At the start of the application, a **World** object is initialized and defines the environment for the entities within it. In it's constructor it initializes all the entities in the simulation. The entities that are spawned by default, is the **Planet** object and the **Rocket** object. These inherit from the root **Entity** class, which defines primitive properties like position and looks. Other classes are **Rigidbody**, **ParticleSystem** and **Particle**.
