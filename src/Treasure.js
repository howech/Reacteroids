import Particle from './Particle';
import { asteroidVertices, randomNumBetween } from './helpers';

export default class Treasure {
  constructor(args) {
    this.position = args.position
    this.velocity = {
      x: randomNumBetween(-1.5, 1.5),
      y: randomNumBetween(-1.5, 1.5)
    }
    this.rotation = 0;
    this.rotationSpeed = randomNumBetween(-1, 1)
    this.radius = args.size;
    this.treasure = Math.floor(randomNumBetween(1,5.99))
    this.create = args.create;
    this.addTreasure = args.addTreasure;
    this.vertices = asteroidVertices(8, args.size);
    this.timer = 100;
  }
  
  color(){
    return ['#F86','#F8B','#D8C','#B8D','#98E','#88F', '#8EF'][this.treasure]
  }
  
  
  destroy(){
    this.delete = true;

    // Explode
    for (let i = 0; i < this.radius; i++) {
      const particle = new Particle({
        lifeSpan: randomNumBetween(60, 100),
        size: randomNumBetween(1, 3),
        position: {
          x: this.position.x + randomNumBetween(-this.radius/4, this.radius/4),
          y: this.position.y + randomNumBetween(-this.radius/4, this.radius/4)
        },
        velocity: {
          x: randomNumBetween(-1.5, 1.5),
          y: randomNumBetween(-1.5, 1.5)
        },
        color: this.color()
      });
      this.create(particle, 'particles');
    }
  }

  pickup(){
    this.delete = true;
    this.addTreasure(this.treasure)
  }

  render(state){
    // Move
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    this.timer -= 1;
    if( this.timer == 0) {
      this.treasure -= 1;
      if(this.treasure > 0) {
        this.timer = 100
      } else {
        this.destroy();
      }
    }
    // Rotation
    this.rotation += this.rotationSpeed;
    if (this.rotation >= 360) {
      this.rotation -= 360;
    }
    if (this.rotation < 0) {
      this.rotation += 360;
    }

    // Screen edges
    if(this.position.x > state.screen.width + this.radius) this.position.x = -this.radius;
    else if(this.position.x < -this.radius) this.position.x = state.screen.width + this.radius;
    if(this.position.y > state.screen.height + this.radius) this.position.y = -this.radius;
    else if(this.position.y < -this.radius) this.position.y = state.screen.height + this.radius;

    // Draw
    const context = state.context;
    context.save();
    context.translate(this.position.x, this.position.y);
    context.rotate(this.rotation * Math.PI / 180);
    context.strokeStyle = this.color();
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, -this.radius);
    for (let i = 1; i < this.vertices.length; i++) {
      context.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    context.closePath();
    context.stroke();
    context.restore();
  }
}
