import { Scene, Input, Types } from "phaser";
import { Player } from "../gameobjects/Player";
import { BlueEnemy } from "../gameobjects/BlueEnemy";
import { Bullet } from "../gameobjects/Bullet";

export class MainScene extends Scene {
    player: Player | null = null;
    enemy_blue: BlueEnemy | null = null;
    cursors!: Types.Input.Keyboard.CursorKeys;

    points: number = 0;
    game_over_timeout: number = 20;

    constructor() {
        super("MainScene");
    }

    init(): void {
        this.cameras.main.fadeIn(1000, 0, 0, 0);
        this.scene.launch("MenuScene");

        // Reset points
        this.points = 0;
        this.game_over_timeout = 20;
    }

    create(): void {
        this.add.image(0, 0, "background")
            .setOrigin(0, 0);
        this.add.image(0, this.scale.height, "floor").setOrigin(0, 1);

        // Player
        this.player = new Player({ scene: this });

        // Enemy
        this.enemy_blue = new BlueEnemy(this);

        // Cursor keys 
        this.setupControls();
        
        // Setup collisions
        this.setupCollisions();

        // This event comes from MenuScene
        this.game.events.on("start-game", () => {
            this.scene.stop("MenuScene");
            this.scene.launch("HudScene", { remaining_time: this.game_over_timeout });
            
            if (this.player) {
                this.player.start();
            }
            
            if (this.enemy_blue) {
                this.enemy_blue.start();
            }

            // Game Over timeout
            this.time.addEvent({
                delay: 1000,
                loop: true,
                callback: () => {
                    if (this.game_over_timeout === 0) {
                        // You need remove the event listener to avoid duplicate events.
                        this.game.events.removeListener("start-game");
                        // It is necessary to stop the scenes launched in parallel.
                        this.scene.stop("HudScene");
                        this.scene.start("GameOverScene", { points: this.points });
                    } else {
                        this.game_over_timeout--;
                        const hudScene = this.scene.get("HudScene");
                        if (hudScene && typeof (hudScene as any).update_timeout === 'function') {
                            (hudScene as any).update_timeout(this.game_over_timeout);
                        }
                    }
                }
            });
        });
    }

    setupControls(): void {
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // @ts-ignore - We know this.cursors is not null at this point
        this.cursors.space.on("down", () => {
            if (this.player) {
                this.player.fire();
            }
        });
        
        this.input.on("pointerdown", (pointer: Input.Pointer) => {
            if (this.player) {
                this.player.fire(pointer.x, pointer.y);
            }
        });
    }

    setupCollisions(): void {
        // Overlap enemy with bullets
        if (this.player && this.enemy_blue) {
            this.physics.add.overlap(this.player.bullets, this.enemy_blue, (_enemy, bullet) => {
                const typedBullet = bullet as unknown as Bullet;
                if (typedBullet.destroyBullet && this.player && this.enemy_blue) {
                    typedBullet.destroyBullet();
                    this.enemy_blue.damage(this.player.x, this.player.y);
                    this.points += 10;
                    const hudScene = this.scene.get("HudScene");
                    if (hudScene && typeof (hudScene as any).update_points === 'function') {
                        (hudScene as any).update_points(this.points);
                    }
                }
            });

            // Overlap player with enemy bullets
            this.physics.add.overlap(this.enemy_blue.bullets, this.player, (_player, bullet) => {
                const typedBullet = bullet as unknown as Bullet;
                if (typedBullet.destroyBullet) {
                    typedBullet.destroyBullet();
                    this.cameras.main.shake(100, 0.01);
                    // Flash the color white for 300ms
                    this.cameras.main.flash(300, 255, 10, 10, false);
                    this.points -= 10;
                    const hudScene = this.scene.get("HudScene");
                    if (hudScene && typeof (hudScene as any).update_points === 'function') {
                        (hudScene as any).update_points(this.points);
                    }
                }
            });
        }
    }

    update(): void {
        if (this.player) {
            this.player.update();
        }
        
        if (this.enemy_blue) {
            this.enemy_blue.update();
        }

        // Player movement entries
        if (this.player) {
            if (this.cursors.up.isDown) {
                this.player.move("up");
            }
            if (this.cursors.down.isDown) {
                this.player.move("down");
            }
        }
    }
} 
