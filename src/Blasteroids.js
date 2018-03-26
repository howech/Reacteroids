import React, { Component } from 'react';
import Ship from './Ship';
import Asteroid from './Asteroid';
import { randomNumBetweenExcluding } from './helpers'

const KEY = {
  LEFT:  37,
  RIGHT: 39,
  UP: 38,
  A: 65,
  D: 68,
  W: 87,
  N1: 49,
  N2: 50,
  N3: 51, 
  N4: 52,
  N5: 53,
  SPACE: 32
};

const upgradeTypes = [
  'bulletCount',
  'bulletTime',
  'rotationSpeed',
  'speed'
  ];

const beginUpgrades = {
  upgradeCost: 5,
  bulletCount: 1,
  bulletTime: 1,
  rotationSpeed: 1,
  speed: 1,
};

export class Blasteroids extends Component {
  constructor() {
    super();
    this.n = [0,0,0,0,0]
    this.state = {
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
      context: null,
      keys : {
        left  : 0,
        right : 0,
        up    : 0,
        down  : 0,
        space : 0,
      },
      asteroidCount: 1,
      currentScore: 0,
      currentTreasure: 0,
      topScore: localStorage['topscore'] || 0,
      inGame: false,
      upgrades: beginUpgrades,
    }
    this.ship = [];
    this.asteroids = [];
    this.bullets = [];
    this.particles = [];
    this.treasures = [];
  }
  
  handleResize(value, e){
    this.setState({
      screen : {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      }
    });
  }

  handleKeys(value, e){
    let keys = this.state.keys;
    if(e.keyCode === KEY.LEFT   || e.keyCode === KEY.A) keys.left  = value;
    if(e.keyCode === KEY.RIGHT  || e.keyCode === KEY.D) keys.right = value;
    if(e.keyCode === KEY.UP     || e.keyCode === KEY.W) keys.up    = value;
    if(e.keyCode === KEY.SPACE) keys.space = value;

    if(e.keyCode >= KEY.N1 && e.keyCode <= KEY.N5) {
      const i = e.keyCode - KEY.N1
      if(this.n[i] === 0 && value ) {
        this.n[i] = value
        this.upgrade(i)
      } else {
        this.n[i] = 0
      }
    }
    
    this.setState({
      keys : keys
    });
  }

  componentDidMount() {
    window.addEventListener('keyup',   this.handleKeys.bind(this, false));
    window.addEventListener('keydown', this.handleKeys.bind(this, true));
    window.addEventListener('resize',  this.handleResize.bind(this, false));

    const context = this.refs.canvas.getContext('2d');
    this.setState({ context: context });
    this.startGame();
    requestAnimationFrame(() => {this.update()});
  }

  componentWillUnmount() {
    window.removeEventListener('keyup', this.handleKeys);
    window.removeEventListener('keydown', this.handleKeys);
    window.removeEventListener('resize', this.handleResize);
  }

  update() {
    const context = this.state.context;
    const keys = this.state.keys;
    const ship = this.ship[0];

    context.save();
    context.scale(this.state.screen.ratio, this.state.screen.ratio);

    // Motion trail
    context.fillStyle = '#000';
    context.globalAlpha = 0.4;
    context.fillRect(0, 0, this.state.screen.width, this.state.screen.height);
    context.globalAlpha = 1;

    // Next set of asteroids
    if(!this.asteroids.length){
      let count = this.state.asteroidCount + 1;
      this.setState({ asteroidCount: count });
      this.generateAsteroids(count)
    }

    // Check for colisions
    this.checkCollisionsWith(this.bullets, this.asteroids);
    this.checkCollisionsWith(this.bullets, this.treasures);
    this.checkCollisionsWith(this.ship, this.asteroids);
    this.checkPickup(this.ship, this.treasures)

    // Remove or render
    this.updateObjects(this.particles, 'particles')
    this.updateObjects(this.treasures, 'treasures')
    this.updateObjects(this.asteroids, 'asteroids')
    this.updateObjects(this.bullets, 'bullets')
    this.updateObjects(this.ship, 'ship')

    context.restore();

    // Next frame
    requestAnimationFrame(() => {this.update()});
  }

  addScore(points){
    if(this.state.inGame){
      this.setState({
        currentScore: this.state.currentScore + points,
      });
    }
  }
  
  upgrade(index) {
    const type = upgradeTypes[index];
    const upgrades = this.state.upgrades;
    if( this.state.currentTreasure < upgrades.upgradeCost ) {
      return
    }

    if(type === 'bulletCount') {
      if(upgrades.bulletCount >= 10) 
        return
      upgrades.bulletCount += 1
    } else if(type === 'bulletTime') {
      if(upgrades.bulletTime >= 10) 
        return
      upgrades.bulletTime += 1
    } else if(type === 'rotationSpeed') {
      if(upgrades.rotationSpeed >= 10) 
        return
      upgrades.rotationSpeed += 1
    } else if(type === 'speed') {
      if(upgrades.speed >= 10) 
        return
      upgrades.speed += 1
    }

    const currentTreasure = this.state.currentTreasure - upgrades.upgradeCost;
    upgrades.upgradeCost += 2
    
    this.ship[0].upgrade(upgrades)
    this.setState({upgrades, currentTreasure})
  }
  

  getBulletTime() {
    return 8 + 4 * this.state.upgrades.bulletTime
  }
  
  getBulletCount() {
    return this.state.upgrades.bulletCount
  }
  
  canFire() {
    return this.bullets.length < this.state.upgrades.bulletCount
  }
  
  getRotationSpeed() {
    return 4 + 0.5 * this.state.upgrades.rotationSpeed
  }
  
  getSpeed() {
    return 0.1 + 0.02 * this.state.upgrades.speed
  }

  addTreasure(points) {
    if(this.state.inGame){
      this.setState({
        currentTreasure: this.state.currentTreasure + points,
      });
    }
  }

  startGame(){
    this.setState({
      inGame: true,
      currentScore: 0,
      currentTreasure: 0,
      asteroidCount: 1,
      upgrades: {...beginUpgrades},
    });

    // Make ship
    let ship = new Ship({
      position: {
        x: this.state.screen.width/2,
        y: this.state.screen.height/2
      },
      upgrades: this.state.upgrades,
      create: this.createObject.bind(this),
      onDie: this.gameOver.bind(this),
      getBulletCount: this.getBulletCount.bind(this),
      getBulletTime: this.getBulletTime.bind(this),
      getRotationSpeed: this.getRotationSpeed.bind(this),
      getSpeed: this.getSpeed.bind(this),
      canFire: this.canFire.bind(this),
    });
    
    this.createObject(ship, 'ship');

    // Make asteroids
    this.asteroids = [];
    this.treasures = [];
    this.generateAsteroids(this.state.asteroidCount)
  }

  gameOver(){
    this.setState({
      inGame: false,
      upgrades: {...beginUpgrades},
      asteroidCount: 1,
    });

    // Replace top score
    if(this.state.currentScore > this.state.topScore){
      this.setState({
        topScore: this.state.currentScore,
      });
      localStorage['topscore'] = this.state.currentScore;
    }
  }

  generateAsteroids(howMany){
    let asteroids = [];
    let ship = this.ship[0];
    for (let i = 0; i < howMany; i++) {
      let asteroid = new Asteroid({
        size: 80,
        position: {
          x: randomNumBetweenExcluding(0, this.state.screen.width, ship.position.x-60, ship.position.x+60),
          y: randomNumBetweenExcluding(0, this.state.screen.height, ship.position.y-60, ship.position.y+60)
        },
        create: this.createObject.bind(this),
        addScore: this.addScore.bind(this),
        addTreasure: this.addTreasure.bind(this),
      });
      this.createObject(asteroid, 'asteroids');
    }
  }

  createObject(item, group){
    this[group].push(item);
  }

  updateObjects(items, group){
    let index = 0;
    for (let item of items) {
      if (item.delete) {
        this[group].splice(index, 1);
      }else{
        items[index].render(this.state);
      }
      index++;
    }
  }

  checkCollisionsWith(items1, items2) {
    var a = items1.length - 1;
    var b;
    for(a; a > -1; --a){
      b = items2.length - 1;
      for(b; b > -1; --b){
        var item1 = items1[a];
        var item2 = items2[b];
        if(this.checkCollision(item1, item2)){
          item1.destroy();
          item2.destroy();
        }
      }
    }
  }

  checkPickup(items1, items2) {
    var a = items1.length - 1;
    var b;
    for(a; a > -1; --a){
      b = items2.length - 1;
      for(b; b > -1; --b){
        var item1 = items1[a];
        var item2 = items2[b];
        if(this.checkCollision(item1, item2)){
          item2.pickup();
        }
      }
    }
  }

  checkCollision(obj1, obj2){
    var vx = obj1.position.x - obj2.position.x;
    var vy = obj1.position.y - obj2.position.y;
    var length = Math.sqrt(vx * vx + vy * vy);
    if(length < obj1.radius + obj2.radius){
      return true;
    }
    return false;
  }

  render() {
    let endgame;
    let message;
    let rightScore;

    if (this.state.currentScore <= 0) {
      message = '0 points... So sad.';
    } else if (this.state.currentScore >= this.state.topScore){
      message = 'Top score with ' + this.state.currentScore + ' points. Woo!';
    } else {
      message = this.state.currentScore + ' Points though :)'
    }

    if(!this.state.inGame){
      endgame = (
        <div className="endgame">
          <p>Game over, man!</p>
          <p>{message}</p>
          <button
            onClick={ this.startGame.bind(this) }>
            try again?
          </button>
        </div>
      )
      rightScore = (
        <span className="score top-score" >Top Score: {this.state.topScore}</span>
        )
    } else {
      rightScore = (
        <span className="score current-credits" >Credits: {this.state.currentTreasure}</span>
        )
    }

    return (
      <div>
        { endgame }
        <span className="score current-score" >Score: {this.state.currentScore}</span>
        { rightScore }
        <span className="controls" >
          Use [A][S][W][D] or [←][↑][↓][→] to MOVE<br/>
          Use [SPACE] to SHOOT -- Use [1]-[5] to UPGRADE
        </span>
        <canvas ref="canvas"
          width={this.state.screen.width * this.state.screen.ratio}
          height={this.state.screen.height * this.state.screen.ratio}
        />
        <div className="shipStatus">
          <div><span>1) Shots:</span><span className="upgradeLevel">{this.state.upgrades.bulletCount}</span></div>
          <div><span>2) Range:</span><span className="upgradeLevel"> {this.state.upgrades.bulletTime}</span></div>
          <div><span>3) Turn:</span><span className="upgradeLevel"> {this.state.upgrades.rotationSpeed}</span></div>
          <div><span>4) Accel:</span><span className="upgradeLevel"> {this.state.upgrades.speed}</span></div>
          <div><span>Cost:</span><span className="upgradeLevel"> {this.state.upgrades.upgradeCost}</span></div>
        </div>
      </div>
    );
  }
}
