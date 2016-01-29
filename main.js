$(document).ready(function () {
    var scene, camera, renderer, effect, controls, stats;

    var guiParams = {
        focalLength: 35
    };

    var config = {
        cylRadius: 50,
        cylThickness: 20,
        cylHeight: 30
    };

    var AMB_LIGHT_COLOR = 0x888888;
    var DIR_LIGHT_COLOR = 0xffffff;

    function addAxis() {
        var axisHelper = new THREE.AxisHelper(5000);
        scene.add(axisHelper);
    }

    function addLights() {
        var ambLight = new THREE.AmbientLight(AMB_LIGHT_COLOR);
        scene.add(ambLight);

        var light1 = new THREE.DirectionalLight(DIR_LIGHT_COLOR);
        light1.position.set(0, -2, 10);
        //light1.add(new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 8), new THREE.MeshBasicMaterial({ color: DIR_LIGHT_COLOR })));
        scene.add(light1);

        var light2 = new THREE.DirectionalLight(DIR_LIGHT_COLOR);
        light2.position.set(20, 20, 10);
        scene.add(light2);
    }

    function addControls(params) {
        if (!!params.trackball) {
            controls = new THREE.TrackballControls(camera);
            controls.rotateSpeed = 0.1;
            controls.zoomSpeed = 0.1;
            controls.panSpeed = 0.1;
            controls.noZoom = false;
            controls.noPan = false;
            controls.staticMoving = true;
            controls.dynamicDampingFactor = 0.3;
        } else {
            controls = new THREE.OrbitControls(camera);
            controls.rotateSpeed = 0.5;
            controls.zoomSpeed = 0.3;
            controls.panSpeed = 0.2;
            controls.maxPolarAngle = Math.PI / 2;
            //controls.target = new THREE.Vector3(0, 0, -100);
        }
        controls.addEventListener('change', render);
    }

    function addStats() {
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        stats.domElement.style.zIndex = 100;
        document.body.appendChild(stats.domElement);
    }

    function resize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        if (!!effect) {
            effect.setSize(window.innerWidth, window.innerHeight);
        }
        //render(); // may be expensive
    }

    function setStereoEffect(params) {
        // Creates the Stereo Effect for the VR experience.
        if (!!params.oculus) {
            effect = new THREE.OculusRiftEffect(renderer);
        } else {
            effect = new THREE.StereoEffect(renderer);
        }
        effect.setSize(window.innerWidth, window.innerHeight);
    }

    function addParamsGui() {
        var gui = new dat.GUI();
        gui.add(guiParams, 'focalLength', { '15mm': 15, '35mm': 35, '50mm': 50 } );
        gui.open();
    }

    function init() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(guiParams.focalLength, window.innerWidth / window.innerHeight, .1, 2000);
        camera.position.set(0, -100, 50);
        camera.up.set(0, 0, 1);
        camera.lookAt(new THREE.Vector3(0, 50, 20));


        scene.fog = new THREE.FogExp2(0x333333, 0.001);
        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setClearColor(scene.fog.color);
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Enable effect optionally
        //setStereoEffect({oculus: true});

        //addParamsGui(); // Does not work well with trackball controls
        addAxis();
        addLights();
        addControls({trackball: false});
        //addStats();
        addPointsFromData(processData(generateData(250)));

        window.addEventListener('resize', resize, false);

        render();
    }

    // 0 <= n < x
    function getRandInt(x) {
        return Math.floor(Math.random() * x);
    }

    // -x/2 <= n < x/2
    function getRandIntSymmetric(x) {
        return Math.floor(Math.random() * x - x / 2);
    }

    // n: number of levels
    function generateData(n) {
        var data = [];

        while (n--) {
            data.push({
                city: 'city' + n,
                crimeRate: getRandInt(100),
                population: 1000 + getRandInt(20000)
            });
        }

        return data;
    }

    // Add layout info to input data
    function processData(data) {
        var thetaScale = d3.scale.linear()
            .domain(d3.extent(data, function (d) { return d.crimeRate; }))
            .range([0, Math.PI]);
        data.forEach(function (d) {
            d.theta = thetaScale(d.crimeRate);
            var radius = config.cylRadius + getRandInt(config.cylThickness);
            d.x = radius * Math.cos(d.theta);
            d.y = radius * Math.sin(d.theta);
            d.z = 0;
        });

        return data;
    }

    function addPointsFromData(data) {
        var boxSizeScale = d3.scale.linear()
            .domain(d3.extent(data, function (d) { return d.population; }))
            .range([1, 2]);
        var colorScale = d3.scale.linear()
            .domain([0, 100])
            .range(['#9aca40', '#ff3300']);
        var heightScale = d3.scale.linear()
            .domain(d3.extent(data, function (d) { return d.population; }))
            .range([0, config.cylHeight]);
        data.forEach(function (d) {
            var boxSize = boxSizeScale(d.population);
            var pointBox = new THREE.Mesh(new THREE.BoxGeometry(boxSize, boxSize, boxSize), new THREE.MeshLambertMaterial({color: colorScale(d.crimeRate)}));
            pointBox.position.x = d.x;
            pointBox.position.y = d.y;
            pointBox.position.z = heightScale(d.population);
            scene.add(pointBox);
        });
    }

    function render() {
        if (!!effect) {
            effect.render(scene, camera);
        } else {
            renderer.render(scene, camera);
        }
        if (!!stats) {
            stats.update();
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        if (!!controls) {
            controls.update();
        }
    }

    init();
    animate();
});
