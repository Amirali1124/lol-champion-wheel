/* ============================================================
   Summoner's Roulette — LoL champion wheel
   Vanilla JS + Three.js (WebGL). 3D wheel, segment labels drawn to
   canvas textures, cinematic slow-down, confetti burst, DOM UI.
   ============================================================ */
(function () {
  "use strict";

  /* ─────────────────────────  CHAMPION DATA  ─────────────────────────
     lane:  toplane | jungle | midlane | botlane | support
     picks: [lane, ...] — a champion is kept if ANY pick survives filters. */
  var CHAMPS = [
    { name: "Aatrox",      title: "The Darkin Blade",   lanes: ["top", "mid"] },
    { name: "Ahri",        title: "The Nine-Tailed Fox",lanes: ["mid", "jungle"] },
    { name: "Akali",       title: "The Rogue Assassin", lanes: ["mid", "top"] },
    { name: "Alistar",     title: "The Mightiest Minotaur", lanes: ["support", "top"] },
    { name: "Amumu",       title: "The Cursed Child",   lanes: ["support", "jungle", "top"] },
    { name: "Annie",       title: "The Dark Child",     lanes: ["mid", "top", "support"] },
    { name: "Aphelios",    title: "The Weapon of the Underworld", lanes: ["bot"] },
    { name: "Ashe",        title: "Frost Archer",       lanes: ["bot", "jungle"] },
    { name: "Aurelion Sol",title: "The Magistar",       lanes: ["mid"] },
    { name: "Azir",        title: "The Emperor's Divide", lanes: ["mid"] },
    { name: "Bard",        title: "The Wandering Caretaker", lanes: ["support"] },
    { name: "Bel'Veth",    title: "The Empress of the Void", lanes: ["jungle"] },
    { name: "Blitzcrank",  title: "The Steam Golem",    lanes: ["support"] },
    { name: "Brand",       title: "The Mad Fire",       lanes: ["support", "mid"] },
    { name: "Braum",       title: "The Heart of the Freljord", lanes: ["support", "top"] },
    { name: "Caitlyn",     title: "The Sheriff of Piltover", lanes: ["bot"] },
    { name: "Camille",     title: "The Hextech Duellist", lanes: ["top", "jungle"] },
    { name: "Cassiopeia",  title: "The Serpent's Embrace", lanes: ["mid"] },
    { name: "Cho'Gath",    title: "The Terror of the Void", lanes: ["jungle", "top"] },
    { name: "Corki",       title: "The Daring Pilot",   lanes: ["bot", "jungle"] },
    { name: "Darius",      title: "The Hand of Noxus",  lanes: ["top"] },
    { name: "Diana",       title: "The Hand of Moonfall", lanes: ["jungle", "mid"] },
    { name: "Dr. Mundo",   title: "The Madman of Bandle City", lanes: ["jungle", "top"] },
    { name: "Draven",      title: "The Revelous Huntsman", lanes: ["bot"] },
    { name: "Ekko",        title: "The Boy Who Shattered Time", lanes: ["jungle", "mid"] },
    { name: "Elise",       title: "The Spider Queen",   lanes: ["jungle", "support"] },
    { name: "Ezreal",      title: "The Prodigal Explorer", lanes: ["bot", "mid"] },
    { name: "Fiddlesticks",title: "The Crowstorm",      lanes: ["jungle", "mid"] },
    { name: "Fiora",       title: "The Blade Dancer",   lanes: ["top"] },
    { name: "Fizz",        title: "The Sea Trickster",  lanes: ["mid", "top"] },
    { name: "Galio",       title: "The Colossus",      lanes: ["mid", "support", "top"] },
    { name: "Gangplank",   title: "The Ruthless Pirate", lanes: ["top", "jungle"] },
    { name: "Garen",       title: "The Demacian Justice", lanes: ["top", "jungle"] },
    { name: "Gnar",        title: "The Missing Link",   lanes: ["top"] },
    { name: "Gragas",      title: "The Rabble Rouser",  lanes: ["top", "jungle", "mid"] },
    { name: "Graves",      title: "The Unforgotten",    lanes: ["jungle", "bot"] },
    { name: "Gwen",        title: "The Hallowed Seamstress", lanes: ["top", "jungle"] },
    { name: "Hecarim",     title: "The Shadow of War",  lanes: ["jungle", "top"] },
    { name: "Heimerdinger",title: "The Brilliant Inventor", lanes: ["bot", "jungle"] },
    { name: "Illaoi",      title: "The Prophet of the Void", lanes: ["top", "jungle"] },
    { name: "Irelia",      title: "The Vanguard of Ionia", lanes: ["top"] },
    { name: "Ivern",       title: "The Friend of the Forest", lanes: ["jungle"] },
    { name: "Janna",       title: "The Storm Herald",   lanes: ["support"] },
    { name: "Jarvan IV",   title: "The Exemplar of Ionia", lanes: ["jungle", "top"] },
    { name: "Jax",         title: "The Grandmaster at Arms", lanes: ["top", "jungle"] },
    { name: "Jayce",       title: "The Victorious Mech", lanes: ["top", "mid"] },
    { name: "Jhin",        title: "The Virtuoso",      lanes: ["bot"] },
    { name: "Jinx",        title: "The Loose Cannon",   lanes: ["bot"] },
    { name: "Kai'Sa",      title: "Daughter of the Void", lanes: ["bot"] },
    { name: "Kalista",     title: "The Spear of Vengeance", lanes: ["bot", "support"] },
    { name: "Karma",       title: "The Enlightened",    lanes: ["support", "mid"] },
    { name: "Karthus",     title: "The Requiem of Silence", lanes: ["jungle", "mid"] },
    { name: "Kassadin",    title: "The Rift's Shadow",  lanes: ["mid"] },
    { name: "Katarina",    title: "The Sad Midas",     lanes: ["mid"] },
    { name: "Kayn",        title: "The Shadow Reaper",  lanes: ["jungle"] },
    { name: "Kennen",      title: "The Heart of the Storm", lanes: ["top", "jungle", "mid"] },
    { name: "Kha'Zix",     title: "The Voidreaver",    lanes: ["jungle"] },
    { name: "Kindred",     title: "The Eternal Hunters", lanes: ["jungle", "bot"] },
    { name: "Kled",        title: "The Crazy Freak Pilot", lanes: ["top", "jungle"] },
    { name: "Kog'Maw",     title: "The Mouth of the Abyss", lanes: ["bot"] },
    { name: "LeBlanc",     title: "The Trickster",     lanes: ["mid"] },
    { name: "Lee Sin",     title: "The Blind Monk",    lanes: ["jungle", "support"] },
    { name: "Leona",       title: "The Radiant Dawn",   lanes: ["support"] },
    { name: "Lillia",       title: "The Dreaming Sister", lanes: ["jungle"] },
    { name: "Lissandra",   title: "The Ice Witch",     lanes: ["mid"] },
    { name: "Lucian",      title: "The Purifier",      lanes: ["bot"] },
    { name: "Lulu",        title: "The Faerie Seer",   lanes: ["support"] },
    { name: "Lux",         title: "The Lady of Luminescence", lanes: ["mid", "bot", "support"] },
    { name: "Malphite",    title: "The Titan of Rock", lanes: ["top", "mid", "jungle"] },
    { name: "Malzahar",    title: "The Prophet of the Void", lanes: ["mid"] },
    { name: "Maokai",      title: "The Twisted Treant", lanes: ["support", "jungle"] },
    { name: "Master Yi",   title: "The Wuju Blade",    lanes: ["jungle"] },
    { name: "Milio",       title: "The Gentle Healer", lanes: ["support"] },
    { name: "Miss Fortune",title: "The Gunslinger",    lanes: ["bot", "support"] },
    { name: "Mordekaiser", title: "The Iron Tyrant",   lanes: ["top", "jungle"] },
    { name: "Morgana",     title: "The Fallen",        lanes: ["mid", "support"] },
    { name: "Nami",        title: "The Tidecaller",    lanes: ["support"] },
    { name: "Nasus",       title: "The Guardian of the Sands", lanes: ["top"] },
    { name: "Nautilus",    title: "The Titan of the Depths", lanes: ["support", "top"] },
    { name: "Neeko",       title: "The Pop Blossom",   lanes: ["mid", "top", "support"] },
    { name: "Nilah",       title: "The Joy Unbound",   lanes: ["bot", "support"] },
    { name: "Nocturne",    title: "The Paranoia",      lanes: ["jungle"] },
    { name: "Nunu",        title: "The Badlands Boy",  lanes: ["jungle", "top"] },
    { name: "Olaf",        title: "The Freljord Berserker", lanes: ["top", "jungle"] },
    { name: "Orianna",     title: "The Lady of Clockwork", lanes: ["mid"] },
    { name: "Ornn",        title: "The Fire Below the Mountain", lanes: ["top", "jungle"] },
    { name: "Pantheon",    title: "The Will of the Gods", lanes: ["top", "jungle"] },
    { name: "Poppy",       title: "The Keeper of the Hammer", lanes: ["support", "top"] },
    { name: "Pyke",        title: "The Ghost Under the Bridge", lanes: ["support", "bot"] },
    { name: "Qiyana",      title: "The Elementalist",  lanes: ["mid", "support"] },
    { name: "Quinn",       title: "The Wing Corsair",  lanes: ["bot", "top"] },
    { name: "Rakan",       title: "The Grand Entrance", lanes: ["support"] },
    { name: "Rammus",      title: "The Armordillo",    lanes: ["jungle"] },
    { name: "Rek'Sai",     title: "The Void's Hunger", lanes: ["jungle"] },
    { name: "Rell",        title: "The Iron Maiden",   lanes: ["support", "top"] },
    { name: "Renata Glasc",title: "The FSG Adept",     lanes: ["support", "bot"] },
    { name: "Renekton",    title: "The Butcher of the Sands", lanes: ["top"] },
    { name: "Rengar",      title: "The Pride of the Hunt", lanes: ["jungle"] },
    { name: "Riven",       title: "The Exile",         lanes: ["top"] },
    { name: "Rumble",      title: "The Mechanized Menace", lanes: ["top", "jungle"] },
    { name: "Ryze",        title: "The Rune Mage",     lanes: ["mid", "jungle"] },
    { name: "Samira",      title: "The Sharpshooter",  lanes: ["bot"] },
    { name: "Sejuani",     title: "The Fury of the North", lanes: ["jungle", "top"] },
    { name: "Senna",       title: "The Daughter of the Shadows", lanes: ["bot", "support"] },
    { name: "Seraphine",   title: "The Enchantress",   lanes: ["support", "mid"] },
    { name: "Sett",        title: "The One Who Settles It", lanes: ["top"] },
    { name: "Shaco",       title: "The Mad Joker",     lanes: ["jungle", "mid"] },
    { name: "Shen",        title: "The Unblinking Blade", lanes: ["top", "support"] },
    { name: "Shyvana",     title: "The Half-Dragon",   lanes: ["jungle", "top"] },
    { name: "Singed",      title: "The Mad Chemist",   lanes: ["top"] },
    { name: "Sion",        title: "The Undead Juggernaut", lanes: ["top", "jungle"] },
    { name: "Sivir",       title: "The Rebel",         lanes: ["bot"] },
    { name: "Skarner",     title: "The Crystal Colossus", lanes: ["jungle", "support"] },
    { name: "Sona",        title: "The Lady of Cords", lanes: ["support"] },
    { name: "Soraka",      title: "The Starchild",     lanes: ["support"] },
    { name: "Swain",       title: "The Dark Magus",    lanes: ["mid", "jungle"] },
    { name: "Sylas",       title: "The Absconded Slave", lanes: ["jungle", "mid"] },
    { name: "Syndra",      title: "The Dark Sovereign", lanes: ["mid"] },
    { name: "Tahm Kench",  title: "The River Crawler", lanes: ["support", "top"] },
    { name: "Taliyah",     title: "The Stoneweaver",   lanes: ["jungle", "mid"] },
    { name: "Talon",       title: "The Blade's Shadow", lanes: ["jungle", "mid"] },
    { name: "Taric",       title: "The Shield of Freljord", lanes: ["support"] },
    { name: "Teemo",       title: "The Swift Scout",   lanes: ["top", "support", "jungle"] },
    { name: "Thresh",      title: "The Chain Warden",  lanes: ["support"] },
    { name: "Tristana",    title: "The Cannon Barrage", lanes: ["bot"] },
    { name: "Trundle",     title: "The Titan",         lanes: ["top", "jungle"] },
    { name: "Tryndamere",  title: "The Rebel Blade",   lanes: ["top"] },
    { name: "Twisted Fate",title: "The Cardmaster",    lanes: ["mid"] },
    { name: "Twitch",      title: "The Ratcatcher",    lanes: ["jungle", "bot"] },
    { name: "Udyr",        title: "The Spirit Walker", lanes: ["jungle", "top"] },
    { name: "Urgot",       title: "The Purifier",      lanes: ["top"] },
    { name: "Varus",       title: "The Chain of Corruption", lanes: ["bot"] },
    { name: "Vayne",       title: "The Night Hunter",  lanes: ["bot"] },
    { name: "Veigar",      title: "The Boss of the Bottom Lane", lanes: ["mid"] },
    { name: "Vel'Koz",     title: "The Eye of the Void", lanes: ["mid"] },
    { name: "Vex",         title: "The Gloom Shroud",  lanes: ["mid"] },
    { name: "Vi",          title: "The Piltover Enforcer", lanes: ["jungle"] },
    { name: "Viego",       title: "The Ruined King",   lanes: ["jungle"] },
    { name: "Viktor",      title: "The Machine Pioneer", lanes: ["mid"] },
    { name: "Vladimir",    title: "The Crimson Reaper", lanes: ["mid", "top"] },
    { name: "Volibear",    title: "The Thundering Bear", lanes: ["top", "jungle"] },
    { name: "Warwick",     title: "The Unseen Fear",   lanes: ["jungle", "top"] },
    { name: "Wukong",      title: "The Monkey King",   lanes: ["jungle", "top"] },
    { name: "Xayah",       title: "The Rebel",         lanes: ["bot"] },
    { name: "Xerath",      title: "The Loneliest Shot", lanes: ["mid", "bot"] },
    { name: "Xin Zhao",    title: "The Defender of Demacia", lanes: ["jungle", "top"] },
    { name: "Yasuo",       title: "The Unforgiven",    lanes: ["top", "mid"] },
    { name: "Yone",        title: "The Unforgotten",   lanes: ["top", "mid"] },
    { name: "Yorick",      title: "The Gravedigger",   lanes: ["top", "jungle"] },
    { name: "Zac",         title: "The Blob",          lanes: ["jungle", "top"] },
    { name: "Zed",         title: "The Master of Shadows", lanes: ["mid"] },
    { name: "Zeri",        title: "The Spark of Freljord", lanes: ["bot"] },
    { name: "Ziggs",       title: "The Sapper",        lanes: ["bot", "mid"] },
    { name: "Zilean",      title: "The Chronomancer",  lanes: ["support", "mid"] },
    { name: "Zoe",         title: "The Star Awakener", lanes: ["mid"] },
    { name: "Zyra",        title: "The Stranger",      lanes: ["jungle", "support"] }
  ];

  var LANES = [
    { id: "all",      label: "All" },
    { id: "top",      label: "Top" },
    { id: "jungle",   label: "Jungle" },
    { id: "mid",      label: "Mid" },
    { id: "bot",      label: "Bot" },
    { id: "support",  label: "Support" }
  ];

  var LANE_LABEL = { top: "Top", jungle: "Jungle", mid: "Mid", bot: "Bot", support: "Support" };

  /* ── segment palette (neon + gold on deep indigo) ── */
  var SEG_COLORS = ["#7c3aed", "#f43f5e", "#0ea5e9", "#22d3ee", "#f0b64b",
                    "#d946ef", "#4f46e5", "#f97316", "#10b981", "#a855f7",
                    "#38bdf8", "#eab308", "#6366f1", "#fb7185", "#06b6d4"];

  /* ─────────────────────────────  STATE  ───────────────────────────── */
  var state = {
    wheel: [],        // champions currently on the wheel
    pool: [],         // candidates after lane + search filters
    size: Infinity,
    lane: "all",
    query: "",
    removeWinners: true,
    history: [],
    spinning: false,
    lastWinner: null
  };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ─────────────────────────────  DOM  ───────────────────────────── */
  var $ = function (id) { return document.getElementById(id); };
  var el = {
    wrap:      $("canvas-wrap"),
    canvas:    $("wheel-canvas"),
    badge:     $("spin-badge"),
    result:    $("result"),
    resName:   $("result-name"),
    resRole:   $("result-role"),
    resLanes:  $("result-lanes"),
    resAvatar: $("result-avatar"),
    roleChips: $("role-chips"),
    sizeGroup: $("size-group"),
    search:    $("search"),
    count:     $("pool-count"),
    readName: $("readout-name"),
    readLane: $("readout-lane"),
    spin:      $("btn-spin"),
    spinLabel: $("spin-label"),
    shuffle:   $("btn-shuffle"),
    toggle:    $("toggle-remove"),
    copy:      $("btn-copy"),
    history:   $("history"),
    historyEmpty: $("history-empty"),
    clear:     $("btn-clear"),
    live:      $("live-region")
  };

  /* ════════════════════════════════════════════════════════════════
     THREE.JS 3D WHEEL
     ════════════════════════════════════════════════════════════════ */
  var W = {
    renderer: null, scene: null, camera: null, wheelGroup: null,
    rim: null, hub: null, peg: null, rimLight: null, envTarget: null,
    confetti: null, confettiVel: null, confettiCount: 0,
    clock: null, tiltX: 0.30, targetTiltX: 0.30,
    ready: false, webgl: false,
    rotation: 0, // current wheel rotation (radians, -Z)
    segments: [], // { start, mid, arc, color, mesh }
    pointerAngle: -Math.PI / 2
  };

  var TILT_MIN = 0.08, TILT_MAX = 0.46;

  /* Sword pointer sprite. The source art is 564×165 with the blade
     running to the right; rotating it a quarter turn points the blade
     down at the rim, so the tip marks the winning segment. */
  var SWORD_LEN = 3.1;                                   // world units, along the blade
  var SWORD_ASPECT = 165 / 564;                          // height / width of the art
  var SWORD_TIP_Y = 4.12;                                // where the tip meets the rim
  var SWORD_GLOW = 0x2ee6c8;                             // matches the blade's teal

  function loadSwordTexture() {
    return new Promise(function (resolve) {
      if (!W.renderer) return resolve(null);
      new window.THREE.TextureLoader().load("sword.png", function (tex) {
        tex.colorSpace = window.THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        W.swordTexture = tex;
        resolve(tex);
      }, undefined, function () {
        /* Opened straight off disk (file://), browsers refuse to hand a
           local file to WebGL, so fall back to the inline copy. */
        if (window.SWORD_DATA_URLS) {
          W.swordDataUrl = window.SWORD_DATA_URLS.webp || window.SWORD_DATA_URLS.png;
          new window.THREE.TextureLoader().load(W.swordDataUrl, function (tex) {
            tex.colorSpace = window.THREE.SRGBColorSpace;
            tex.needsUpdate = true;
            W.swordTexture = tex;
            resolve(tex);
          }, undefined, function () { resolve(null); });
        } else {
          console.warn("sword.png failed to load; using the wedge pointer");
          resolve(null);
        }
      });
    });
  }

  function initThree() {
    if (typeof window.THREE === "undefined") {
      document.body.classList.add("no-webgl");
      return false;
    }
    try {
      var T = window.THREE;

      var renderer = new T.WebGLRenderer({
        canvas: el.canvas, antialias: true, alpha: true, powerPreference: "high-performance"
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      W.renderer = renderer;

      var scene = new T.Scene();
      W.scene = scene;
      if (!/[?&]noenv/.test(location.search)) buildEnvironment(renderer, scene);

      var camera = new T.PerspectiveCamera(38, 1, 0.1, 120);
      camera.position.set(0, 0, 11);
      W.camera = camera;

      /* ── lighting: key / fill / rim ── */
      scene.add(new T.AmbientLight(0x8f86d8, 0.55));
      var key = new T.DirectionalLight(0xfff2d8, 2.1); key.position.set(3.5, 6, 7);
      scene.add(key);
      var fill = new T.DirectionalLight(0x7c3aed, 1.2); fill.position.set(-6, -2, 4);
      scene.add(fill);
      var rimL = new T.DirectionalLight(0x22d3ee, 1.5); rimL.position.set(0, 4, -8);
      scene.add(rimL);
      W.rimLight = rimL;

      /* ── pedestal glow behind wheel ── */
      var glowGeo = new T.CircleGeometry(6.2, 64);
      var glowMat = new T.MeshBasicMaterial({
        color: 0x7c3aed, transparent: true, opacity: 0.16, depthWrite: false
      });
      var glow = new T.Mesh(glowGeo, glowMat);
      glow.position.set(0, -0.6, -3.4);
      scene.add(glow);

      /* ── wheel group ── */
      var wheelGroup = new T.Group();
      scene.add(wheelGroup);
      W.wheelGroup = wheelGroup;

      /* ── confetti field ── */
      W.confetti = [];
      var cGeo = new T.PlaneGeometry(0.16, 0.26);
      var cMat = new T.MeshBasicMaterial({ side: T.DoubleSide, transparent: true });
      for (var i = 0; i < 140; i++) {
        var c = new T.Mesh(cGeo, cMat.clone());
        c.visible = false;
        scene.add(c);
        W.confetti.push({ mesh: c, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0, spin: 0, life: 0 });
      }
      W.confettiCount = 0;

      W.clock = new T.Clock();
      W.webgl = true;
      resizeRenderer();
      return true;
    } catch (err) {
      console.warn("WebGL init failed:", err);
      document.body.classList.add("no-webgl");
      W.webgl = false;
      return false;
    }
  }

  function buildWheel(segments) {
    var T = window.THREE;
    if (!T) return;
    var group = W.wheelGroup;

    // clear previous
    while (group.children.length) {
      var child = group.children[0];
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    }

    W.segments = [];
    var n = segments.length;
    if (!n) return;

    var R = 4.0;               // wheel radius
    var DEPTH = 0.46;          // wheel thickness
    var segArc = (Math.PI * 2) / n;

    // ── back plate ──
    var backGeo = new T.CylinderGeometry(R, R, DEPTH, 96, 1, false);
    var backMat = new T.MeshStandardMaterial({
      color: 0x14102c, metalness: 0.9, roughness: 0.34
    });
    var back = new T.Mesh(backGeo, backMat);
    back.rotation.x = Math.PI / 2;
    back.position.z = -DEPTH / 2;
    group.add(back);

    // ── segment wedges ──
    var wedgeShape = new T.Shape();
    wedgeShape.moveTo(0, 0);
    wedgeShape.lineTo(R, 0);
    wedgeShape.absarc(0, 0, R, 0, segArc, false);
    wedgeShape.lineTo(0, 0);

    /* Normalise UVs over the whole circle so every wedge samples the entire
       texture. The texture then is a map of the wheel, and each segment
       draws its own sliver at its own angle. (A per-segment frame was
       tried first; it skews the sampling region into a narrow band.) */
    var uvGen = {
      generateTopUV: function (geometry, vertices, indexA, indexB, indexC) {
        var uv = function (idx) {
          return new T.Vector2(
            (vertices[idx * 3] + R) / (2 * R),
            (vertices[idx * 3 + 1] + R) / (2 * R)
          );
        };
        return [uv(indexA), uv(indexB), uv(indexC)];
      },
      generateSideWallUV: function (geometry, vertices, indexA, indexB, indexC, indexD) {
        return [
          new T.Vector2(0, 0), new T.Vector2(1, 0),
          new T.Vector2(0, 1), new T.Vector2(1, 1)
        ];
      }
    };

    // Text needs real estate; with many segments the sliver is too thin,
    // so drop the texture size to keep VRAM down.
    var texSize = n <= 24 ? 1024 : (n <= 48 ? 512 : 128);
    var curveSeg = n > 48 ? 2 : (n > 24 ? 8 : 24);

    for (var i = 0; i < n; i++) {
      var colorHex = SEG_COLORS[i % SEG_COLORS.length];
      /* The geometry's UVs map the apex to (1,1) and local +X to (0,1), i.e.
           the texture is rotated a quarter turn relative to the wheel. A
           segment at local angle a therefore sits at canvas angle a - PI/2,
           with canvas Y flipped so the text reads the right way round. */
      var tex = labelTexture(segments[i].name, (i + 0.5) * segArc - Math.PI / 2, segArc, colorHex, texSize);

      var geo = new T.ExtrudeGeometry(wedgeShape, {
        depth: DEPTH, bevelEnabled: true, UVGenerator: uvGen,
        bevelThickness: 0.028, bevelSize: 0.028, bevelSegments: 2, curveSegments: curveSeg
      });
      var mat = new T.MeshStandardMaterial({
        color: 0xffffff,
        map: tex,
        metalness: 0.18,
        roughness: 0.46,
        emissive: new T.Color(colorHex),
        emissiveIntensity: 0.12
      });
      var mesh = new T.Mesh(geo, mat);
      mesh.rotation.z = -i * segArc;
      mesh.position.z = -DEPTH / 2;
      mesh.userData.index = i;
      group.add(mesh);

      // invisible wide hit target for picking
      var hitShape = new T.Shape();
      hitShape.moveTo(0, 0);
      hitShape.lineTo(R, 0);
      hitShape.absarc(0, 0, R, 0, segArc, false);
      hitShape.lineTo(0, 0);
      var hit = new T.Mesh(
        new T.ShapeGeometry(hitShape, 24),
        new T.MeshBasicMaterial({ visible: false })
      );
      hit.rotation.z = -i * segArc;
      hit.position.z = DEPTH / 2 + 0.01;
      hit.userData.index = i;
      group.add(hit);

      W.segments.push({
        index: i,
        // angle in wheel-local space of the segment centre
        mid: (i + 0.5) * segArc,
        arc: segArc,
        color: colorHex,
        name: segments[i].name
      });
    }
    W.picker = null;

    // ── outer rim ──
    var rimGeo = new T.TorusGeometry(R + 0.12, 0.19, 20, 128);
    var rimMat = new T.MeshStandardMaterial({
      color: 0xc79a3e, metalness: 0.9, roughness: 0.24,
      emissive: 0xf0b64b, emissiveIntensity: 0.18
    });
    W.rim = new T.Mesh(rimGeo, rimMat);
    W.rim.position.z = -DEPTH / 2 + 0.02;
    group.add(W.rim);

    // rim emissive studs
    var studGeo = new T.SphereGeometry(0.075, 14, 14);
    var studMat = new T.MeshStandardMaterial({
      color: 0xffe9b0, emissive: 0xffd070, emissiveIntensity: 1.5,
      metalness: 0.6, roughness: 0.3
    });
    var studCount = 26;
    for (var s = 0; s < studCount; s++) {
      var a = (s / studCount) * Math.PI * 2;
      var stud = new T.Mesh(studGeo, studMat);
      stud.position.set(Math.cos(a) * (R + 0.12), Math.sin(a) * (R + 0.12), DEPTH / 2 + 0.04);
      group.add(stud);
    }

    // ── hub ── */
    var hubGeo = new T.CylinderGeometry(0.95, 1.05, 0.62, 48);
    var hubMat = new T.MeshStandardMaterial({
      color: 0x1c1745, metalness: 0.95, roughness: 0.28,
      emissive: 0x4c1d95, emissiveIntensity: 0.4
    });
    W.hub = new T.Mesh(hubGeo, hubMat);
    W.hub.rotation.x = Math.PI / 2;
    W.hub.position.z = DEPTH / 2 + 0.2;
    group.add(W.hub);

    var hubRingGeo = new T.TorusGeometry(0.92, 0.06, 12, 64);
    var hubRingMat = new T.MeshStandardMaterial({
      color: 0xf0b64b, metalness: 0.85, roughness: 0.22,
      emissive: 0xf0b64b, emissiveIntensity: 0.35
    });
    var hubRing = new T.Mesh(hubRingGeo, hubRingMat);
    hubRing.position.z = DEPTH / 2 + 0.52;
    group.add(hubRing);

    // ── pegs on the hub edge (they orbit with the wheel, giving
    //    the visual "tick" as each segment passes the pointer) ──
    W.pegs = [];
    var pegGeo = new T.ConeGeometry(0.1, 0.34, 10);
    var pegMat = new T.MeshStandardMaterial({
      color: 0xffd884, emissive: 0xffc454, emissiveIntensity: 0.9,
      metalness: 0.8, roughness: 0.25
    });
    var pegCount = Math.min(n, 12);
    for (var p = 0; p < pegCount; p++) {
      var pa = (p / pegCount) * Math.PI * 2;
      var peg = new T.Mesh(pegGeo, pegMat);
      peg.position.set(Math.cos(pa) * 1.22, Math.sin(pa) * 1.22, DEPTH / 2 + 0.42);
      peg.rotation.x = Math.PI / 2;
      group.add(peg);
      W.pegs.push(peg);
    }

    // ── fixed pointer: the blade sprite, tip pointing at 12 o'clock ──
    // buildWheel runs on every rebuild, so clear any previous pointer
    // rather than stacking a new one into the scene each time.
    if (W.pointerGroup) {
      W.scene.remove(W.pointerGroup);
      W.pointerGroup.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
    var pointerGroup = new T.Group();
    pointerGroup.position.set(0, SWORD_TIP_Y, 0.8);
    W.scene.add(pointerGroup);
    W.pointerGroup = pointerGroup;

    if (W.swordTexture) {
      var swordW = SWORD_LEN;                 // across the sprite before rotation
      var swordH = SWORD_LEN * SWORD_ASPECT;
      var sprite = new T.Mesh(
        new T.PlaneGeometry(swordW, swordH),
        new T.MeshBasicMaterial({
          map: W.swordTexture, transparent: true, depthWrite: false,
          toneMapped: false, side: T.DoubleSide
        })
      );
      /* Three-quarter turn puts the blade down at the rim, upside down
         with the crossguard above it. The sprite is offset upward by
         half its length so the tip sits at the group's origin. */
      sprite.rotation.z = -Math.PI / 2;
      sprite.position.y = swordW / 2;
      pointerGroup.add(sprite);

      // teal glow behind the tip, matching the blade
      var sgGeo = new T.TorusGeometry(0.34, 0.05, 12, 48);
      var sgMat = new T.MeshBasicMaterial({
        color: SWORD_GLOW, transparent: true, opacity: 0.7
      });
      var sglow = new T.Mesh(sgGeo, sgMat);
      sglow.position.set(0, -0.14, -0.08);
      pointerGroup.add(sglow);
      W.swordGlow = sglow;
    } else {
      // Fallback wedge while the sprite loads (or if it fails).
      var pShape = new T.Shape();
      pShape.moveTo(-0.34, 0.62);
      pShape.lineTo(0.34, 0.62);
      pShape.lineTo(0.12, -0.30);
      pShape.lineTo(-0.12, -0.30);
      pShape.closePath();
      var pointer = new T.Mesh(
        new T.ExtrudeGeometry(pShape, {
          depth: 0.30, bevelEnabled: true, bevelThickness: 0.05,
          bevelSize: 0.05, bevelSegments: 3
        }),
        new T.MeshStandardMaterial({
          color: 0xf0b64b, metalness: 0.85, roughness: 0.2,
          emissive: 0xf0b64b, emissiveIntensity: 0.4
        })
      );
      pointer.rotation.x = -Math.PI / 2;
      pointer.position.y = 0.3;
      pointerGroup.add(pointer);
    }

    // glow ring behind the blade tip
    if (!W.swordGlow) {
      var pgGeo = new T.TorusGeometry(0.46, 0.045, 12, 48);
      var pgMat = new T.MeshBasicMaterial({ color: 0xffd884, transparent: true, opacity: 0.85 });
      var pglow = new T.Mesh(pgGeo, pgMat);
      pglow.position.set(0, -0.16, -0.06);
      pointerGroup.add(pglow);
      W.pointerGlow = pglow;
    }
  }

  /* Draw a segment's gold band + champion name into a canvas texture.
     The wedge is a triangle, so the band's inner/outer edges taper as
     they move away from the centre. The name goes inside that band,
     which means long names need a left-to-right taper correction. */
  /* One texture per segment, drawn on a canvas that maps the whole circle.
       The segment's sliver is centred at `midAngle` (canvas angle) and
       spans `segArc`. Names are drawn horizontally along the radius —
       fan-rotated labels were unreadable at real sizes. */
  function labelTexture(name, midAngle, segArc, hexColor, texSize) {
    var T = window.THREE;
    var TEX = texSize;
    var R = TEX / 2;
    var cv = document.createElement("canvas");
    cv.width = TEX; cv.height = TEX;
    var g = cv.getContext("2d");

    /* Band spans the outer part of the segment; the inner wedge keeps its
       own colour, which gives the wheel some depth. */
    var rIn = R * 0.42;
    var rOut = R * 0.985;
    var half = segArc / 2;

    var base = new T.Color(hexColor);
    var lighten = base.clone().offsetHSL(0, 0.06, 0.10);
    var darken = base.clone().offsetHSL(0, 0.04, -0.09);
    var bg = g.createLinearGradient(0, 0, 0, TEX);
    bg.addColorStop(0.0, "#" + lighten.getHexString());
    bg.addColorStop(0.55, "#" + base.getHexString());
    bg.addColorStop(1.0, "#" + darken.getHexString());
    g.fillStyle = bg;
    g.fillRect(0, 0, TEX, TEX);

    /* Gold band: the segment's wedge, held back from the rim so the
       neighbouring colours still read as separate wedges. */
    var theta = half * 0.86;
    var grad = g.createLinearGradient(0, R - rOut, 0, R + rOut);
    grad.addColorStop(0.00, "#f9e0a4");
    grad.addColorStop(0.30, "#e8ad34");
    grad.addColorStop(0.62, "#a8741a");
    grad.addColorStop(1.00, "#f2c25e");

    g.beginPath();
    g.moveTo(R + Math.cos(midAngle - theta) * rIn, R + Math.sin(midAngle - theta) * rIn);
    g.arc(R, R, rIn, midAngle - theta, midAngle + theta, false);
    g.lineTo(R + Math.cos(midAngle + theta) * rOut, R + Math.sin(midAngle + theta) * rOut);
    g.arc(R, R, rOut, midAngle + theta, midAngle - theta, true);
    g.closePath();
    g.fillStyle = grad;
    g.fill();

    /* Name, horizontal, sitting on the band at mid-radius. */
    var rMid = (rIn + rOut) / 2;
    var chord = 2 * rMid * Math.sin(half);

    var size = Math.round(TEX * 0.075);
    g.textAlign = "center";
    g.textBaseline = "middle";
    while (size > 7) {
      g.font = '400 ' + size + 'px "Russo One", "Chakra Petch", system-ui, sans-serif';
      if (g.measureText(name).width <= chord * 0.96) break;
      size -= 2;
    }

    if (size > 7) {
      /* Draw horizontally in a frame rotated onto the bisector, then
         counter-rotate so the glyphs stay upright in texture space. A
         test with the text drawn in screen space produced sideways
         labels, which are unreadable at real sizes. */
      g.save();
      g.translate(R + Math.cos(midAngle) * rMid, R + Math.sin(midAngle) * rMid);
      g.rotate(midAngle + Math.PI / 2);   // undo the quarter-turn offset
      g.scale(1, -1);                     // texture space has V growing downward
      g.fillStyle = "#2a1c04";
      g.fillText(name, 0, 0);
      g.restore();
    }

    var tex = new T.CanvasTexture(cv);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }

  /* Procedural studio environment so the metallic gold has something
     to reflect. Without it, metalness:1 surfaces render nearly black. */
  function buildEnvironment(renderer, scene) {
    try {
      var T = window.THREE;
      var cv = document.createElement("canvas");
      cv.width = 512; cv.height = 256;
      var g = cv.getContext("2d");

      var grd = g.createLinearGradient(0, 0, 0, 256);
      grd.addColorStop(0.00, "#6b5bd6");
      grd.addColorStop(0.42, "#2a2358");
      grd.addColorStop(0.58, "#141033");
      grd.addColorStop(1.00, "#07060f");
      g.fillStyle = grd;
      g.fillRect(0, 0, 512, 256);

      var key = g.createRadialGradient(150, 55, 0, 150, 55, 180);
      key.addColorStop(0, "rgba(255,238,196,0.95)");
      key.addColorStop(1, "rgba(255,238,196,0)");
      g.fillStyle = key;
      g.fillRect(0, 0, 512, 256);

      var rim = g.createRadialGradient(390, 85, 0, 390, 85, 160);
      rim.addColorStop(0, "rgba(80,220,255,0.65)");
      rim.addColorStop(1, "rgba(80,220,255,0)");
      g.fillStyle = rim;
      g.fillRect(0, 0, 512, 256);

      var tex = new T.CanvasTexture(cv);
      tex.mapping = T.EquirectangularReflectionMapping;
      tex.colorSpace = T.SRGBColorSpace;

      /* Keep the render target alive: scene.environment points into it,
         so disposing the generator here would leave a dangling texture. */
      var pmrem = new T.PMREMGenerator(renderer);
      var target = pmrem.fromEquirectangular(tex);
      scene.environment = target.texture;
      W.envTarget = target;
      pmrem.dispose();
      tex.dispose();
      return true;
    } catch (err) {
      console.warn("Environment map unavailable:", err);
      return false;
    }
  }

  function resizeRenderer() {
    if (!W.renderer) return;
    var rect = el.wrap.getBoundingClientRect();
    var w = Math.max(240, Math.floor(rect.width));
    var h = Math.max(240, Math.floor(rect.height));
    W.renderer.setSize(w, h, false);
    W.camera.aspect = w / h;
    W.camera.updateProjectionMatrix();

    /* Frame the wheel plus its pointer headroom. Pointer tip sits at
       y=5.03 and the bottom rim at y=-4.31, and the pivot's 0.30rad tilt
       pushes the far side another R*sin(tilt) down, so budget for both. */
    var vFov = (W.camera.fov * Math.PI) / 180;
    var need = 6.4 + 4.31 * Math.sin(Math.max(W.tiltX, 0.16));
    var dist = (need / Math.tan(vFov / 2)) / Math.min(1, W.camera.aspect);
    W.camera.position.set(0, 0.2, dist);
  }

  /* ── render loop ── */
  var idleSpin = 0;
  function tick() {
    if (!W.webgl) return;
    requestAnimationFrame(tick);
    var dt = Math.min(W.clock.getDelta(), 0.05);
    var t = W.clock.getElapsedTime();

    if (!state.spinning) {
      idleSpin += dt * 0.16;
      W.wheelGroup.rotation.z = W.rotation + Math.sin(idleSpin) * 0.012;
    }

    // parallax tilt
    var px = window.innerWidth / window.innerHeight;
    if (!reduceMotion) {
      W.targetTiltX = Math.max(TILT_MIN, Math.min(TILT_MAX, 0.30 + (px - 0.72) * 0.55));
      W.tiltX += (W.targetTiltX - W.tiltX) * Math.min(1, dt * 6);
    }
    W.wheelGroup.rotation.x = W.tiltX;

    // rim shimmer
    if (W.rim && W.rim.material) {
      W.rim.material.emissiveIntensity = 0.18 + Math.sin(t * 1.6) * 0.08;
    }

    // pointer pulse
    var pulse = reduceMotion ? 0.8 : 0.62 + Math.sin(t * 3.4) * 0.28;
    if (W.swordGlow) {
      W.swordGlow.material.opacity = pulse;
    } else if (W.pointerGlow) {
      W.pointerGlow.material.opacity = pulse;
    }
    if (W.pointerGroup && !reduceMotion) {
      W.pointerGroup.position.z = 0.8 + Math.sin(t * 3.4) * 0.06;
    }

    stepConfetti(dt);
    updateReadout();
    W.renderer.render(W.scene, W.camera);
  }

  /* Show the champion currently beneath the pointer. At 156 segments the
     sliver is far too thin to letter, so the name lives here instead. */
  var lastReadIdx = -1;
  function updateReadout() {
    var idx = segmentAtPointer();
    if (idx === lastReadIdx) return;
    lastReadIdx = idx;
    var champ = state.wheel[idx];
    if (!champ) { el.readName.textContent = "—"; el.readLane.textContent = ""; return; }
    el.readName.textContent = champ.name;
    el.readLane.textContent = LANE_LABEL[champ.lanes[0]] || "";
  }

  /* ─────────────────────────  CONFETTI  ───────────────────────── */
  function burstConfetti(colorHex) {
    if (!W.webgl || reduceMotion) return;
    var T = window.THREE;
    var base = new T.Color(colorHex);
    var origin = new T.Vector3(0, 4.4, 0.8);
    for (var i = 0; i < W.confetti.length; i++) {
      var p = W.confetti[i];
      p.mesh.visible = true;
      p.mesh.position.copy(origin);
      p.mesh.scale.setScalar(0.7 + Math.random() * 0.9);
      p.mesh.material.color.copy(base).offsetHSL(
        (Math.random() - 0.5) * 0.10, 0, (Math.random() - 0.5) * 0.22
      );
      p.mesh.material.opacity = 1;
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.3;
      var speed = 4.2 + Math.random() * 5.4;
      p.vx = Math.cos(a) * speed;
      p.vy = Math.sin(a) * speed * 0.9;
      p.vz = 1.4 + Math.random() * 3.4;
      p.rx = Math.random() * 6; p.ry = Math.random() * 6; p.rz = Math.random() * 6;
      p.spin = 6 + Math.random() * 12;
      p.life = 1.6 + Math.random() * 1.1;
    }
  }

  function stepConfetti(dt) {
    for (var i = 0; i < W.confetti.length; i++) {
      var p = W.confetti[i];
      if (!p.mesh.visible) continue;
      p.life -= dt;
      if (p.life <= 0) { p.mesh.visible = false; continue; }
      p.vy -= 9.4 * dt;
      p.vz -= 1.6 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.rx += p.spin * dt; p.ry += p.spin * 0.8 * dt; p.rz += p.spin * 0.6 * dt;
      p.mesh.rotation.set(p.rx, p.ry, p.rz);
      p.mesh.material.opacity = Math.min(1, p.life / 0.7);
    }
  }

  /* ════════════════════════════════════════════════════════════════
     POOL / WHEEL LOGIC
     ════════════════════════════════════════════════════════════════ */
  function matchesFilters(champ) {
    if (state.lane !== "all" && champ.lanes.indexOf(state.lane) === -1) return false;
    if (state.query && champ.name.toLowerCase().indexOf(state.query) === -1) return false;
    return true;
  }

  function updatePoolCount() {
    el.count.textContent = state.pool.length + (state.pool.length === 1 ? " champion" : " champions");
  }

  function refreshPool() {
    state.pool = CHAMPS.filter(matchesFilters);
    updatePoolCount();
    // keep current lineup if it is still valid, else rebuild
    var stillValid = state.wheel.length && state.wheel.every(matchesFilters);
    if (!stillValid) rebuildWheel();
    renderChips();
  }

  function rebuildWheel() {
    var pool = state.pool.slice();
    if (!pool.length) {
      state.wheel = [];
      buildWheel([]);
      updateSpinButton();
      return;
    }
    var count = state.size === Infinity ? pool.length : Math.min(state.size, pool.length);
    if (count === pool.length) {
      // "All" keeps every champion; shuffle so the wheel doesn't
      // always start in the same order.
      for (var s = pool.length - 1; s > 0; s--) {
        var t2 = Math.floor(Math.random() * (s + 1));
        var tmp = pool[s]; pool[s] = pool[t2]; pool[t2] = tmp;
      }
    } else {
      for (var i = pool.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
      }
    }
    state.wheel = pool.slice(0, count);
    buildWheel(state.wheel);
    updateSpinButton();
  }

  /* Which segment currently sits under the pointer.
     Segment i's centre lives at wheel-local angle (i + 0.5) * segArc, and
     setting rotation.z = r rotates the wheel by -r, so the bisector ends
     up at (i + 0.5) * segArc - r. */
  function segmentAtPointer() {
    var n = state.wheel.length;
    if (!n) return -1;
    var segArc = (Math.PI * 2) / n;
    var idx = Math.round((W.pointerAngle + W.rotation) / segArc - 0.5);
    return ((idx % n) + n) % n;
  }

  /* ════════════════════════════════════════════════════════════════
     SPIN
     ════════════════════════════════════════════════════════════════ */
  var spinAnim = null;
var tickScheduled = false;
var pendingFinish = false;

  function spin() {
    if (state.spinning) return;
    if (!state.wheel.length) {
      // pool may have drained because winners were removed
      refreshPool();
      if (!state.wheel.length) return;
    }

    var n = state.wheel.length;
    var targetIndex = Math.floor(Math.random() * n);
    var segArc = (Math.PI * 2) / n;

    // rotation that parks the target segment's bisector under the pointer
    var desired = (targetIndex + 0.5) * segArc - W.pointerAngle;

    var current = W.rotation;
    var turns = 5 + Math.floor(Math.random() * 3);              // 5–7 full turns
    var delta = (desired - current) + turns * Math.PI * 2;
    while (delta < 0) delta += Math.PI * 2;

    var duration = reduceMotion ? 0.9 : 5.4 + Math.random() * 1.2;
    var t0 = performance.now();

    state.spinning = true;
    updateSpinButton();
    el.badge.classList.add("is-on");

    if (spinAnim) cancelAnimationFrame(spinAnim);

    var ease = function (t) {
      // quintic out — long cinematic deceleration
      return 1 - Math.pow(1 - t, 5);
    };

    var step = function (now) {
      var t = Math.min(1, (now - t0) / (duration * 1000));
      W.rotation = current + delta * ease(t);
      W.wheelGroup.rotation.z = W.rotation;
      if (t < 1) {
        spinAnim = requestAnimationFrame(step);
      } else {
        // Hand back to the render loop so the wheel's displayed
        // rotation and the rotation we read back stay identical.
        spinAnim = null;
        pendingFinish = true;
        if (!tickScheduled && W.webgl) {
          tickScheduled = true;
          requestAnimationFrame(function () {
            tickScheduled = false;
            if (pendingFinish) { pendingFinish = false; finishSpin(); }
          });
        } else {
          pendingFinish = false;
          finishSpin();
        }
      }
    };
    spinAnim = requestAnimationFrame(step);
  }

  function finishSpin() {
    var idx = segmentAtPointer();
    var champ = state.wheel[idx] || state.wheel[0];
    state.spinning = false;
    el.badge.classList.remove("is-on");
    updateSpinButton();
    if (!champ) return;

    state.lastWinner = champ.name;
    burstConfetti(W.segments[idx] ? W.segments[idx].color : "#f0b64b");
    showResult(champ);

    state.history.unshift(champ);
    if (state.history.length > 8) state.history.pop();
    renderHistory();

    announce(champ.name + " is your champion. " + champ.title + ".");

    /* Winners leave the *filtered* pool so they cannot be drawn again,
       but the underlying champion list stays intact — otherwise a later
       lane change or search would keep them permanently removed. */
    if (state.removeWinners) {
      var i = state.pool.indexOf(champ);
      if (i > -1) state.pool.splice(i, 1);
      rebuildWheel();
      renderChips();
      updatePoolCount();
    }
  }

  function showResult(champ) {
    el.result.hidden = false;
    el.resName.textContent = champ.name;
    el.resAvatar.textContent = champ.name.charAt(0);
    el.resRole.textContent = LANE_LABEL[champ.lanes[0]] || champ.lanes[0];
    el.resLanes.textContent = champ.lanes.map(function (l) { return LANE_LABEL[l] || l; }).join(" · ");
    el.result.style.animation = "none";
    void el.result.offsetWidth;              // restart the entrance animation
    el.result.style.animation = "";
  }

  function announce(msg) { el.live.textContent = msg; }

  function renderHistory() {
    el.history.innerHTML = "";
    el.historyEmpty.hidden = state.history.length > 0;
    state.history.forEach(function (c, i) {
      var li = document.createElement("li");
      var rank = document.createElement("span");
      rank.className = "history__rank";
      rank.textContent = "#" + (i + 1);
      var name = document.createElement("span");
      name.className = "history__name";
      name.textContent = c.name;
      var lane = document.createElement("span");
      lane.className = "history__lane";
      lane.textContent = LANE_LABEL[c.lanes[0]] || "";
      li.appendChild(rank); li.appendChild(name); li.appendChild(lane);
      el.history.appendChild(li);
    });
  }

  /* ════════════════════════════════════════════════════════════════
     UI WIRING
     ════════════════════════════════════════════════════════════════ */
  function renderChips() {
    el.roleChips.innerHTML = "";
    LANES.forEach(function (lane) {
      var pool = CHAMPS.filter(function (c) {
        if (lane.id !== "all" && c.lanes.indexOf(lane.id) === -1) return false;
        if (state.query && c.name.toLowerCase().indexOf(state.query) === -1) return false;
        return true;
      });
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.setAttribute("aria-pressed", String(state.lane === lane.id));
      b.innerHTML = lane.label + ' <span class="chip__count">' + pool.length + "</span>";
      b.addEventListener("click", function () {
        if (state.spinning || state.lane === lane.id) return;
        state.lane = lane.id;
        refreshPool();
      });
      el.roleChips.appendChild(b);
    });
  }

  function renderSizes() {
    el.sizeGroup.innerHTML = "";
    [[6, "6"], [12, "12"], [40, "40"], [Infinity, "All"]].forEach(function (pair) {
      var n = pair[0];
      var b = document.createElement("button");
      b.type = "button";
      b.className = "segmented__opt";
      b.textContent = pair[1];
      b.setAttribute("aria-pressed", String(state.size === n));
      b.addEventListener("click", function () {
        if (state.spinning || state.size === n) return;
        state.size = n;
        renderSizes();
        rebuildWheel();
      });
      el.sizeGroup.appendChild(b);
    });
  }

  function updateSpinButton() {
    var ready = state.wheel.length > 0 && !state.spinning;
    el.spin.disabled = !ready;
    el.spinLabel.textContent = state.spinning
      ? "Spinning…"
      : (state.wheel.length ? "Spin" : "No champions");
    el.spin.setAttribute("aria-busy", String(state.spinning));
  }

  function bind() {
    el.spin.addEventListener("click", spin);

    el.shuffle.addEventListener("click", function () {
      if (state.spinning) return;
      rebuildWheel();
      announce("New lineup of " + state.wheel.length + " champions.");
    });

    el.search.addEventListener("input", function (e) {
      state.query = e.target.value.trim().toLowerCase();
      if (state.spinning) return;
      refreshPool();
    });

    el.toggle.addEventListener("change", function (e) {
      state.removeWinners = e.target.checked;
    });

    el.clear.addEventListener("click", function () {
      state.history = [];
      renderHistory();
      announce("Recent picks cleared.");
    });

    el.copy.addEventListener("click", function () {
      var text = state.lastWinner || "";
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { flashCopy("Copied"); },
          function () { flashCopy("Copy failed"); }
        );
      } else {
        flashCopy("Copy failed");
      }
    });

    // keyboard: Space or Enter spins when not typing
    document.addEventListener("keydown", function (e) {
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.code === "Space" || e.key === "Enter") {
        if (e.target.tagName === "BUTTON") return;  // let the button handle it
        e.preventDefault();
        spin();
      }
    });

    window.addEventListener("resize", function () {
      resizeRenderer();
    });
  }

  function flashCopy(label) {
    var original = "Copy";
    el.copy.textContent = label;
    setTimeout(function () { el.copy.textContent = original; }, 1400);
    announce(label);
  }

  /* ════════════════════════════════════════════════════════════════
     INIT
     ════════════════════════════════════════════════════════════════ */
  function init() {
    renderSizes();
    if (initThree()) {
      buildWheel([]);        // placeholder until pool is ready
      tick();
      // Swap the fallback wedge for the sword once the sprite arrives.
      loadSwordTexture().then(function (tex) {
        if (tex) buildWheel(state.wheel);
      });
    }
    bind();
    refreshPool();           // builds the real wheel
    renderHistory();
    updateSpinButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();