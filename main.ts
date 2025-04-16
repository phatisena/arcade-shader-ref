namespace SpriteKind {
    //% isKind
    export const Shader = SpriteKind.create();
}

//% color="#9e6eb8" icon="\uf0eb"
namespace shader {
                        /* blank shade */
    const shadeNull     = (hex``)                                 /*   null shade   */
    const shadeDark100  = (hex`00000000000000000000000000000000`) /*  blank shade   */
                        /* light shade */
    const shadeLight100 = (hex`01010101010101010101010101010101`) /*   very light   */
    const shadeLight75  = (hex`0D01050101010101010101010D01010D`) /*  medium light  */
    const shadeLight50  = (hex`0B010301050109010901050D0301050B`) /*   low light    */
    const shadeLight25  = (hex`0C01040503010709060103030B01040C`) /* a little light */
                        /* dark shade  */
    const shadeDark20   = (hex`000D0A0B0E0408060C060B0C0F0B0C0F`) /* a little dark  */
    const shadeDark40   = (hex`000B0C0C0C0E0C080F080C0F0F0C0F0F`) /*    low dark    */
    const shadeDark60   = (hex`000C0F0F0F0C0F0C0F0C0F0F0F0F0F0F`) /*  medium dark   */
    const shadeDark80   = (hex`000F0F0F0F0F0F0F0F0F0F0F0F0F0F0F`) /*   very dark    */
    
    let screenRowsBuffer: Buffer;
    let maskRowsBuffer: Buffer;

    export enum ShadeLevel {
        //% block="dark 20%"
        Dark20 = 0,
        //% block="dark 40%"
        Dark40 = 1,
        //% block="dark 60%"
        Dark60 = 2,
        //% block="dark 80%"
        Dark80 = 3,
        //% block="dark 100%"
        Dark100 = 4,
        //% block="light 25%"
        Light25 = -1,
        //% block="light 50%"
        Light50 = -2,
        //% block="light 75%"
        Light75 = -3,
        //% block="light 100%"
        Light100 = -4,
    }

    function shadeImage(target: Image, left: number, top: number, mask: Image, palette: Buffer) {
        if (!screenRowsBuffer || screenRowsBuffer.length < target.height) {
            screenRowsBuffer = pins.createBuffer(target.height);
        }
        if (!maskRowsBuffer || maskRowsBuffer.length < target.height) {
            maskRowsBuffer = pins.createBuffer(mask.height);
        }

        let targetX = left | 0;
        let targetY = top | 0;
        let y: number;
        let x: number;

        for (x = 0; x < mask.width; x++, targetX++) {
            if (targetX >= target.width) break;
            else if (targetX < 0) continue;

            mask.getRows(x, maskRowsBuffer);
            target.getRows(targetX, screenRowsBuffer);

            for (y = 0, targetY = top | 0; y < mask.height; y++, targetY++) {
                if (targetY >= target.height) break;
                else if (targetY < 0) continue;

                if (maskRowsBuffer[y]) screenRowsBuffer[targetY] = palette[screenRowsBuffer[targetY]];
            }
            target.setRows(targetX, screenRowsBuffer)
        }
    }

    function shadeitem(shadeLevel: number): Buffer {
        switch (shadeLevel) {
            case  0: return shadeDark20  ;
            case  1: return shadeDark40  ;
            case  2: return shadeDark60  ;
            case  3: return shadeDark80  ;
            case  4: return shadeDark100 ;
            case -1: return shadeLight25 ;
            case -2: return shadeLight50 ;
            case -3: return shadeLight75 ;
            case -4: return shadeLight100;
        }
        if (shadeLevel < 0) return shadeLight100
        return shadeDark100
    }

    /**
     * create shader sprite as rectangle image.
     * @param width of ractangle image
     * @param height of ractangle image 
     * @param shade level as enum or number 
     */
    //% blockId=shader_createRectangularShaderSprite
    //% block="create rectangular shader with width $width height $height shade $shadeLevel"
    //% shadeLevel.shadow=shader_shadelevel
    //% width.defl=16
    //% height.defl=16
    //% blockSetVariable=myShader
    //% weight=90
    export function createRectangularShaderSprite(width: number, height: number, shadeLevel: number): Sprite {
        const scene = game.currentScene();

        let palette: Buffer;

        palette = shadeitem(shadeLevel);
        const i = image.create(width, height);
        i.fill(3);

        const sprite = new ShaderSprite(i, palette)
        sprite.setKind(SpriteKind.Shader);
        scene.physicsEngine.addSprite(sprite);

        return sprite
    }

    /**
     * create shader sprite as your image.
     * @param image to render 
     * @param shade level as enum or number
     */
    //% blockId=shader_createImageShaderSprite
    //% block="create image shader with $image shade $shadeLevel"
    //% image.shadow=screen_image_picker
    //% shadeLevel.shadow=shader_shadelevel
    //% blockSetVariable=myShader
    //% weight=100
    export function createImageShaderSprite(image: Image, shadeLevel: number): Sprite {
        const scene = game.currentScene();

        let palette: Buffer;

        palette = shadeitem(shadeLevel);

        const sprite = new ShaderSprite(image, palette)
        sprite.setKind(SpriteKind.Shader);
        scene.physicsEngine.addSprite(sprite);
        sprite.shadeRectangle = false;

        return sprite
    }

    /**
     * setting shade level as enum or number for shader sprite.
     * @param current shader sprite not original sprite 
     * @param new shade level as enum or number
     */
    //% blockId=shader_setShadeLevel
    //% block=" $spr set shade level to $shadeLevel=shader_shadelevel"
    //% spr.shadow=variables_get spr.defl=myShader
    //% weight=70
    export function setShade(spr: Sprite, shadeLevel: number) {
        let palette: Buffer;
        palette = shadeitem(shadeLevel)
        spr.data["__palette__"] = palette as Buffer
        if (spr instanceof ShaderSprite) {
            (spr as ShaderSprite).onPaletteChanged(); // Update palette when set
        } else {
            throw(`this sprite is not an shader sprite ${spr}`);
        }
    }

    /**
     * enum block shadow for shade level 
     * but not used it.
     */
    //% blockHidden
    //% blockId=shader_shadelevel
    //% block="$level"
    //% shim=TD_ID
    //% weight=50
    export function _shadeLevel(level: ShadeLevel): number {
        return level;
    }

    class ShaderSprite extends Sprite {
        protected shadePalette: Buffer;
        shadeRectangle: boolean;

        constructor(image: Image, shadePalette: Buffer) {
            super(image);
            this.data["__palette__"] = shadePalette as Buffer
            this.shadePalette = shadePalette;
            this.shadeRectangle = true;
            this.onPaletteChanged();
        }

        
        onPaletteChanged() {
            if (this.shadePalette !== this.data["__palette__"]) this.shadePalette = this.data["__palette__"] as Buffer;
        }

        __drawCore(camera: scene.Camera) {
            if (this.isOutOfScreen(camera)) return;

            const ox = (this.flags & sprites.Flag.RelativeToCamera) ? 0 : camera.drawOffsetX;
            const oy = (this.flags & sprites.Flag.RelativeToCamera) ? 0 : camera.drawOffsetY;

            const l = this.left - ox;
            const t = this.top - oy;

            if (this.shadeRectangle) {
                screen.mapRect(l, t, this.image.width, this.image.height, this.shadePalette);
            } else {
                shadeImage(screen, l, t, this.image, this.shadePalette);
            }

            if (this.flags & SpriteFlag.ShowPhysics) {
                const font = image.font5;
                const margin = 2;
                let tx = l;
                let ty = t + this.height + margin;
                screen.print(`${this.x >> 0},${this.y >> 0}`, tx, ty, 1, font);
                tx -= font.charWidth;
                if (this.vx || this.vy) {
                    ty += font.charHeight + margin;
                    screen.print(`v${this.vx >> 0},${this.vy >> 0}`, tx, ty, 1, font);
                }
                if (this.ax || this.ay) {
                    ty += font.charHeight + margin;
                    screen.print(`a${this.ax >> 0},${this.ay >> 0}`, tx, ty, 1, font);
                }
            }

            // debug info
            if (game.debug) {
                screen.drawRect(
                    Fx.toInt(this._hitbox.left) - ox,
                    Fx.toInt(this._hitbox.top) - oy,
                    Fx.toInt(this._hitbox.width),
                    Fx.toInt(this._hitbox.height),
                    1
                );
            }
            
        }
    }

}
