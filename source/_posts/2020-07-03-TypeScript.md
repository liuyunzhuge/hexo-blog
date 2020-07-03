---
title: TypeScript
tags:
  - typescript
date: 2020-07-03 16:17:35
---


`TypeScript`是es的超集，这是官方的定义。经过一段时间的初步学习，我认为这个定义可以简单理解为有强大类型化功能的es。它可以为标准的es提供类型检查的服务，减少代码问题；还有一个好处是，可以为IDE提供快捷的代码提示的功能，提升开发人员的编码体验。

<!-- more -->
## typescript vs babel vs webpack
`typescript` vs `babel`: 二者都有转码能力，但是`babel`在转码时，不具备类型检查的能力，最多能检测出es本身的语法错误。`typescript`更侧重的是语言类型的检查，`babel`更侧重的是`ES6`到`ES5`之间的代码转换。

`typescript` vs `webpack`: `webpack`是单纯的依赖构建工具，它会严格遵守模块之间的依赖关系来输出构建，如果某个依赖不存在，则构建会失败；`typescript`是严格的类型检查工具，它在类型检查时，如果发现有未定义的类型，则会报错，但是只要能想办法把类型定义（ts的声明文件）添加进去，它就不会报错了，即使类型对应的模块可执行文件并不存在。 所以`typescript`更看重类型的有效性，而`webpack`更看重模块的有效性。

这三个工具并不冲突，而且可以相辅相成使用，它们的工作流我认为是这样的：
1. `typescript`提供类型检查和代码提示，开发时用ts编写代码，由`ts`编译为最新的`es6`格式的代码；
2. `babel`将`typescript`编译过后的代码，做转码处理，输出为`es5`的代码；
3. `webpack`根据`babel`的输出，进行构建。

## typescript 的类型系统
这个部分有简单的内容，也有复杂的内容，需要花时间才能积累。官方的文档以及那些流行的前端库中的`.d.ts`文件是非常好的学习资源。

## typescript 的模块机制
在es标准的模块机制出来之前，js的模块化都是利用js语言本身的特性，动态实现的，知名的机制有：amd和commonjs，这些模块化手段本质上是对外隐藏内部实现的js对象；es标准模块机制出来之后，从语言层级提供了模块导入和导出的服务，相比amd和commonjs，我认为它们并没有根本性的区别，只是es标准的模块更能代表一门编程语言的原生特性，始终是有先进性的。而且，虽然现在开发都用es标准在写模块，但真正应用到生产环境中时，还是会通过转码的方式，变为已经应用非常广泛的commonjs等机制。

typescript的模块机制，以es标准的模块机制为基础，只把含`import`或`export`的文件当成模块看待，为了不与es标准内容重复，下面仅列出ts与es标准不一样的一些模块使用特性。

1. 导出声明
    ts除了支持es标准中的声明（var let const function class）外，还支持导出: namespace, enum, interface和type别名。interface和type别名，仅在ts编译期间有生效，在运行期间是不可见的。而namespace和enum虽然也是ts新增的声明类型，但是它们在ts编译之后，会成为可在运行期间真实存在的js对象。
    ```ts
    export class A {}
    export let b = 1
    export function foo() {}
    export enum LEVEL {
        up,
        down
    }
    export namespace D3 {
        export let d = 2
    }
    export interface Animal {
        name: string
    }
    export type AL = Animal
    ```
2. 导入types
    ts3.8以前，可以使用`import`语句导入类型，3.8以后可以使用`import`和`import type`来导入类型。 为什么要加入`import type`的处理？先看`import`:
    ```ts 使用import导入类型
    // ./foo.ts
    export interface Options {
        // ...
    }

    export function doThing(options: Options) {
        // ...
    }

    // ./bar.ts
    import { doThing, Options } from "./foo";

    function doThingBetter(options: Options) {
        // do something twice as good
        doThing(options);
        doThing(options);
    }
    ```
    ```js 编译结果
    // foo.js
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.doThing = void 0;
    function doThing(options) {
        // ...
    }
    exports.doThing = doThing;

    // bar.js
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // ./bar.ts
    var foo_js_1 = require("./foo.js");
    function doThingBetter(options) {
        // do something twice as good
        foo_js_1.doThing(options);
        foo_js_1.doThing(options);
    }
    ```
    es标准模块的导入导出，都是运行时的依赖导入导出，它的操作对象是value。而ts的模块导入导出，除了实现es标准模块的导入导出之后，还实现有它自身基于类型的导入导出，这属于编译阶段的导入导出，在编译完成之后，这个导入导出语句是需要擦除的。 所以上述编译结果中，看不到对`Options`这个类型的导入导出语句。

    上述这种处理方式，默认情况下是没问题的，因为ts能够识别哪些导入导出是类型，然后在导出结果中自动擦除。 但是有一些场景中，这个机制有点问题。
    > 官方说明：https://devblogs.microsoft.com/typescript/announcing-typescript-3-8-beta/#type-only-imports-exports

    首先：
    ```ts
    // ./foo.ts
    export interface Options {
        // ...
    }


    // ./bar.ts
    import { Options } from "./foo";

    export {Options}
    ```
    `bar.ts`这种使用方式，无法识别出`Options`到底是类型还是value。`babel`和`ts`的`transpileModule`API处理`bar.ts`都会生成错误的代码。如果开启`tsconfig.json`中的`isolatedModules`为`true`，将可以看到一个报错提示：
    ```bash
    Re-exporting a type when the '--isolatedModules' flag is provided requires using 'export type'.
    ```

    第二：因为当ts识别出一个import语句仅仅只是导入类型的时候，就会把这个语句从编译结果中抹掉，如果导入类型的这个模块，除了有对外暴露类型外，还有其它运行时的代码需要执行，由于编译结果中抹掉了对模块的导入语句，将导致代码在运行期间会出问题。改善这个方式的办法是：
    ```ts
    // This statement will get erased because of import elision.
    import { SomeTypeFoo, SomeOtherTypeBar } from "./module-with-side-effects";

    // This statement always sticks around.
    import "./module-with-side-effects";
    ```
    也就是需要把模块再用`import`导入一次。显然这个方式是别扭的。

    最后一个例子，出现在`angular`中：
    ```ts
    // ./service.ts
    export class Service {
        // ...
    }
    register("globalServiceId", Service);

    // ./consumer.ts
    import { Service } from "./service.js";

    inject("globalServiceId", function (service: Service) {
        // do stuff with Service
    });
    ```
    上述两个文件，由于`consumer.ts`中发现导入的`service`仅仅只是一个类型的作用，导致`import` `service.ts`的语句在编译结果中被抹掉。最终`comsumer.ts`在执行时一定会报错，因为`service.ts`没有在运行被加载执行。

    综上所述，ts原先考虑将type与value，统一用`import`语句来处理，在少部分的场景中遇到了问题，于是ts3.8以后推出了`import type`语句，这个语句仅仅用来导入类型，而且ts可以非常明确这个import一定会在编译结果中被抹掉。
    ```ts
    import type { SomeThing } from "./some-module.js";

    export type { SomeThing };
    ```
    推出这样的一个导入类型的方式，ts应该是想推动以后导入模块时，要严格区分value和类型的导入，如果是导入value用`import`，如果是导入type用`import type`。 

    通过`import type`导入的类型在使用时只能当成`type`使用，不能当成`value`使用：
    ```ts
    import type { Base } from "my-library";
    import type Foo, { Bar, Baz } from "some-module";
    //     ~~~~~~~~~~~~~~~~~~~~~~
    // error! A type-only import can specify a default import or named bindings, but not both.

    let baseConstructor: typeof Base;
    //                          ~~~~
    // error! 'Base' only refers to a type, but is being used as a value here.

    declare class Derived extends Base {
        //                        ~~~~
        // error! 'Base' only refers to a type, but is being used as a value here.
    }
    ```
    官方3.8的发布说明中这么解释`import type`的意义：
    > That means that you can’t use values even if they’re purely used for type positions. 
    We’re looking at changing this behavior based on recent feedback. Instead of only importing the type side of declarations, we’re planning on changing the meaning of import type to mean “import whatever this is, but only allow it in type positions.” 

    按照这个理解，如果使用`import type`来导入一个类，也无法将它当成类来使用，只能当成类型使用：
    ```ts
    // animal.ts
    export class Animal {
        name: string
    }

    // comsumer.ts
    import type {Animal} from "./animal"

    let animal = new Animal()
    //               ~~~~~~
    // 'Animal' cannot be used as a value because it was imported using 'import type'.
    ```

3. `export =`以及`import = require()`
    ts支持类似commonjs的模块的导出和导入方式：
    ```ts
    let numberRegexp = /^[0-9]+$/;
    class ZipCodeValidator {
        isAcceptable(s: string) {
            return s.length === 5 && numberRegexp.test(s);
        }
    }
    export = ZipCodeValidator;

    // consumer.ts
    import zip = require("./ZipCodeValidator");

    // Some samples to try
    let strings = ["Hello", "98052", "101"];

    // Validators to use
    let validator = new zip();

    // Show whether each string passed each validator
    strings.forEach(s => {
    console.log(`"${ s }" - ${ validator.isAcceptable(s) ? "matches" : "does not match" }`);
    });
    ```
    这种模块导入和导出方式是ts特有的，不推荐使用。

4. `--module`以及`--target`
    `--module`这个编译选项用来指定ts编译后采用何种模块风格，支持：`amd commonjs umd es6 es2015 esnext`等。
    `--target`这个编译选项用来指定ts编译后采用哪个版本的es，支持：`es3 es5 es6 es2016 es2017 esnext`等，覆盖所有的es标准版本。
    `--module`的默认值根据`--target`决定，如果`--target`是`es3`或`es5`，则`--module`默认采用`commonjs`，否则采用`es6`。而`--target`的默认值是`es3`。
    其实现在的生产环境来说，模块规范只有两个是有广泛应用价值的：`commonjs`和`es6`。如果不使用babel，那么`--target`应该设置为`es5`，而`--module`应该设置为`commonjs`，如果使用babel，则可以把`--target`设置为`es6`或更高版本，然后把`--module`设置为`es6`或更高版本。
    为什么`--target`针对es5之后的版本，有那么多个可选值呢？从它的可选值可以看到，`--target`与ecmascript每年的发布周期是有关系的，es标准按照惯例，每年年中发布一个正式版，这样来看的话`--target`每年都会增加一个值。
    为什么`--module`中es5之后的可选值只有`es6 es2015 esnext`呢，这应该是因为`--module`只跟es的模块相关的特性有关系，而es标准虽然每年发布一次，但是不代表每一年都会发布跟模块相关的内容。

5. `Ambient Modules`
    ts有一个非常强大的声明机制，可以用来补充它的类型检查系统。很多的js库并不是用ts开发的，即使用ts开发，但是发布到npm之后，也不是ts的版本，这些库要应用到ts的项目中，就会失去类型检查的特性。 但是利用ts的声明机制，可以把这些库的api，用声明的文件的形式发布出来，这样ts就能利用声明文件，完成类型检查。本质上是利用了ts做的只是编译阶段的工作，而不是运行时的工作，所以它在类型检查时，只需要知道类型是什么，以及到哪里能找到类型即可，至于这个类型对应的真正可执行文件是否存在，它是不管的。ts把这种类型声明称为：`ambient`:
    > We call declarations that don’t define an implementation “ambient”.

    模块也可以利用声明机制，成为一个`ambient module`。 看如下示例：
    ```ts src/consumer.ts
    import Moment from "moment"

    let m = Moment('2020-06-01', 'YYYY-MM-DD')
    ```
    这个示例在`moment`没有安装的情况下是会报错的：
    > Cannot find module 'moment' or its corresponding type declarations.ts

    解决办法已经很清楚了，要么安装`moment`，要么添加它的声明文件。 接下来添加如下模拟的声明文件：
    ```ts src/nest/moment.d.ts
    declare module "moment" {
        export interface MomentClass {
            toJson():string
        }

        interface MomentStatic {
            (dateStr: string, format?: string): MomentClass
        }

        let Moment: MomentStatic

        export default Moment
    }
    ```
    然后修改`src/consumer.js`，顶部使用三斜线指令`<reference path="..."/>`引入上面的声明文件：
    ```ts src/consumer.ts
    /// <reference path="nest/moment.d.ts"/>

    import Moment from "moment"

    let m = Moment('2020-06-01', 'YYYY-MM-DD')
    ```
    此时重新编译就不会看到报错了。编译结果如下：
    ```ts
    "use strict";
    /// <reference path="nest/b.d.ts"/>
    var __importDefault = (this && this.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    const moment_1 = __importDefault(require("moment"));
    let m = moment_1.default('2020-06-01', 'YYYY-MM-DD');
    ```
    从编译结果看到，这是一个`commonjs`风格模块，里面有`require`调用，所以在实际运行时，必须要保证`require('moment')`能加载到`moment`的真正可执行文件才行。但是`ts`通过模拟的`moment`的声明文件，已经知道`moment`的api结构了，所以它能够完成自己的类型编译工作，而`require("moment")`是运行时的工作，它是不管的。也就是说这个声明文件的作用，就是用来声明模块的结构是什么样的，它的潜台词就是有一个模块是这样的结构，如果其它模块在用它的时候不满足它的类型声明，就是错的。

    这个设计的好处就是，尽管在ts推出的时候，大部分js库都不是用ts开发的，但是只要有人愿意为这些库提供声明文件，那这些库就可以顺利在ts中使用，而现在这个工作，大部分js库都已经做完了，所以现在使用ts开发项目，会变得非常方便。

    为了简化模块的声明工作，甚至只需要这么简单的声明一下就可以了：
    ```ts
    declare module "hot-new-module";
    ```
    这样的话，将现有的js项目迁移到ts项目就会简化很多了。

6. 模块的动态加载
    在ts中，如果模块导入的内容，仅仅使用在类型检查的位置当中，那么这个模块的真实引用在编译完之后就会被移除：
    ```ts nest/foo.ts
    export interface StringValidator {
        isAcceptable(s: string): boolean;
    }

    const numberRegexp = /^[0-9]+$/;

    export class ZipCodeValidator implements StringValidator {
        isAcceptable(s: string) {
            return s.length === 5 && numberRegexp.test(s);
        }
    }
    ```
    ```ts bar.ts
    import { ZipCodeValidator as Zip } from "./nest/foo";

    let ZipCodeValidator: typeof Zip = null
    ```
    在上述代码中，`bar.ts`里面使用`Zip`，仅仅是在一个类型检查的位置使用，`typeof Zip`可以得到`Zip`这个名称中的类型含义，所以在`bar.ts`的编译结果中看不到对`foo`模块的引用：
    ```js
    "use strict";
    exports.__esModule = true;
    var ZipCodeValidator = null;
    ```
    利用这一点可以用来做模块的动态加载：
    ```ts bar.ts
    declare function require(moduleName: string): any;

    import { ZipCodeValidator as Zip } from "./nest/foo";


    let loadCondition = Math.random() * 10 > 5

    if(loadCondition) {
        let ZipCodeValidator: typeof Zip = require("./nest/foo")
    }
    ```
    编译结果：
    ```js
    "use strict";
    exports.__esModule = true;
    var loadCondition = Math.random() * 10 > 5;
    if (loadCondition) {
        var ZipCodeValidator = require("./nest/foo");
    }
    ```

7. 什么是模块
    在ts中，不管是`.ts`文件还是`.d.ts`文件，只有里面包含有最顶级的`import`或`export`才会被当成模块处理，否则只会当成一个普通的脚本文件处理，同时它的内容在全局作用域内有效。

    这意味着下面的代码：
    ```ts
    declare namespace DD {
        export interface Selectors {
            select: {
                (selector: string): Selection;
                (element: EventTarget): Selection;
            };
        }

        export interface Event {
            x: number;
            y: number;
        }

        export interface Base extends Selectors {
            event: Event;
        }
    }

    declare var d4: DD.Base;

    export {DD}
    ```
    这段代码如果被三斜线指令引用，就会发现里面的`DD`和`d4`，外部根本无法直接使用，因为这个这个文件包含`export`所以被当成了一个模块，要使用模块内的东西，就要使用`import`的方式。要在三斜线指令中，直接使用这里面的声明，就应该去掉最后的`export`。

8. 模块的真实引用
    这是一个非常重要的特性。当ts导入一个模块后，它会检查导入的内容的使用方式，区分它们是当成类型来使用还是当成值来使用，如果是当成类型来使用，则说明这个模块仅在编译期间需要，在运行期间不需要，所以ts编译结果中不会包含这个模块的真实引用方式，比如`require("")`的调用；如果有当成值来使用，说明这个模块不仅在编译期间需要，在运行期间也需要，所以ts的编译结果中就会包含这个模块真实的引用方式。

## 命名空间
命名空间是ts提供的，es标准中不包含这个，而且编写模块时，ts官方也建议不要在模块内部使用命名空间。

## 模块解析（module resolution）
模块解析就是ts编译器用来弄清每个`import`所指向内容的过程。以`import {a} from "moduleA"`来说，为了弄清`a`的用途，编译器需要准确地知道它的含义是什么，并且需要检查它在`moduleA`中的定义。

编译器需要知道`moduleA`的类型结构是什么？也就是在ts文档中经常提到一个词：`shape`。`moduleA`可以通过自定义的`.ts/.tsx`文件中编写，也可能位于其它所依赖的`.d.ts`文件中。

首先，编译器会尝试去定位一个能够代表导入模块的文件，它会使用两种定位查找策略：`classic`和`node`。如果编译器根据定位查找策略没有找到对应的文件，并且这个模块的路径不是一个相对路径，则编译器会视图通过`ambient modules`来查找这个模块。 `ambient modules`就是定义在`.d.ts`文件中，然后通过三斜线指令`<reference >`来使用的那种模块。如果最终都找不到这个模块，就会抛出错误，提示模块不存在。

### 相对 vs 非相对的模块导入
以`/` `./` `../`开头的导入属于相对导入：
```ts
import Entry from "./components/Entry";
import { DefaultHeaders } from "../constants/http";
import "/mod";
```
其它的属于非相对导入：
```ts
import * as $ from "jquery";
import { Component } from "@angular/core";
```
相对导入完全依赖当前文件与目标模块的相对位置来查找，并且未找到目标模块文件时，也无法降级到去查找`ambient module`，适用于导入项目内部模块。
非相对导入遵循`classic`或`node`的策略来定位文件，并且未找到目标模块时，会启用查找`ambient module`，适用于导入项目外部的模块。

### 解析策略
这个可以通过配置`--moduleResolution`这个编译选项来设置，默认值为：`module === "AMD" or "System" or "ES6" ? "Classic" : "Node"`。

1. `classic`
    这个策略解析相对路径时比较简单，举例来说：`import { b } from "./moduleB"`，位于`/root/src/folder/A.ts`，会进行以下查找：
    ```bash
    /root/src/folder/moduleB.ts
    /root/src/folder/moduleB.d.ts
    ```
    注意它是同时查找`.ts`和`.d.ts`文件。

    这个策略解析非相对路径时，会从当前文件所在目录，逐级往上查找，直到找到位置。举例来说：`import { b } from "moduleB"`，位于`/root/src/folder/A.ts`，会进行以下查找：
    ```bash
    /root/src/folder/moduleB.ts
    /root/src/folder/moduleB.d.ts
    /root/src/moduleB.ts
    /root/src/moduleB.d.ts
    /root/moduleB.ts
    /root/moduleB.d.ts
    /moduleB.ts
    /moduleB.d.ts
    ```
2. `node`
    这个策略是ts以nodejs的模块解析策略为基础，然后添加了自己的解析逻辑。nodejs模块解析策略，也区分相对路径和非相对路径。
    如果是相对路径，以`var x = require("./moduleB")`位于`/root/src/moduelA.js`文件中为例，则会进行以下查找：
    ```bash
    /root/src/moduleB.js，先看这个文件是否存在
    /root/src/moduleB，判断这个目录下是否有package.json文件，并且里面是否有指定一个main字段
    /root/src/moduleB/index.js，最后判断这个文件是否存在
    ```
    如果是绝对路径，则主要以查找`node_modules`为主，举例来说：`var x = require("moduleB")`位于`/root/src/moduelA.js`文件中，那么它会进行以下查找：
    ```bash
    /root/src/node_modules/moduleB.js
    /root/src/node_modules/moduleB/package.json (if it specifies a "main" property)
    /root/src/node_modules/moduleB/index.js

    /root/node_modules/moduleB.js
    /root/node_modules/moduleB/package.json (if it specifies a "main" property)
    /root/node_modules/moduleB/index.js

    /node_modules/moduleB.js
    /node_modules/moduleB/package.json (if it specifies a "main" property)
    /node_modules/moduleB/index.js
    ```

    ts以node的这个解析策略为基础，扩展了自己的解析逻辑。首先它会解析更多的文件格式：`.ts .tsx .d.ts`。然后它会检查`package.json`中的`types`字段指定的文件是否存在，而不是`main`字段，以免与`node`的解析冲突。

    如果是相对路径，以`var x = require("./moduleB")`位于`/root/src/moduelA.ts`文件中为例，则会进行以下查找：
    ```bash
    /root/src/moduleB.ts
    /root/src/moduleB.tsx
    /root/src/moduleB.d.ts
    /root/src/moduleB/package.json (if it specifies a "types" property)
    /root/src/moduleB/index.ts
    /root/src/moduleB/index.tsx
    /root/src/moduleB/index.d.ts
    ```
    如果是非相对路径，以`var x = require("moduleB")`位于`/root/src/moduelA.js`文件中为例，那么它会进行以下查找：
    ```bash
    /root/src/node_modules/moduleB.ts
    /root/src/node_modules/moduleB.tsx
    /root/src/node_modules/moduleB.d.ts
    /root/src/node_modules/moduleB/package.json (if it specifies a "types" property)
    /root/src/node_modules/@types/moduleB.d.ts
    /root/src/node_modules/moduleB/index.ts
    /root/src/node_modules/moduleB/index.tsx
    /root/src/node_modules/moduleB/index.d.ts

    /root/node_modules/moduleB.ts
    /root/node_modules/moduleB.tsx
    /root/node_modules/moduleB.d.ts
    /root/node_modules/moduleB/package.json (if it specifies a "types" property)
    /root/node_modules/@types/moduleB.d.ts
    /root/node_modules/moduleB/index.ts
    /root/node_modules/moduleB/index.tsx
    /root/node_modules/moduleB/index.d.ts

    /node_modules/moduleB.ts
    /node_modules/moduleB.tsx
    /node_modules/moduleB.d.ts
    /node_modules/moduleB/package.json (if it specifies a "types" property)
    /node_modules/@types/moduleB.d.ts
    /node_modules/moduleB/index.ts
    /node_modules/moduleB/index.tsx
    /node_modules/moduleB/index.d.ts
    ```

## @types与相关的编译选项
注意到上面示例中，有提到一个`@types`的`scope`包，这个是社区维护的一个高质量的`ts`的声明文件库，包含了目前大部分的js库以及js环境的声明定义，详情可参考：[http://definitelytyped.org/](http://definitelytyped.org/)。

比如你想引入`jquery`做类型检查，可以安装：
```bash
npm install @types/jquery --save
```
然后就可以在ts项目中使用`@types/jquery`中已经定义好的`jquery`的api结构类型：
```ts
import $ = require('jquery')

// 下面使用$将会有完整的代码提示和类型检查。
// $('#box').addClass('...')
```

这个`@types`被ts加到`node`的模块查找策略中，更方便了开发人员对于社区已有的类型定义的重用，最终目的为了推广ts。

但是这种方式只是安装了`@types/jquery`，然后在ts编译`import $ = require('jquery')`时，它靠`@types/jquery`能够完成对`$`的类型检查，`jquery`模块的可执行文件是没有安装的，所以项目中还需要安装`jquery`，才能完成后续`babel`以及`webpack`等工具的处理。还是那句话，ts不关心模块可执行文件是否存在， 只关心模块的`shape`结构是怎么样的，以及能否找到可以描述它的`shape`的文件。

如果你在用某个第三方的库，发现它还没有相关的声明定义文件，假如你自己已经写好了，则可以按照`@types`官方的发布提交规范，把你的声明文件提交给他们，这样以后别的开发者就可以直接用你写的了。

默认情况下，所有**可见**的`@types`包，都会自动加入的ts的全局编译环境中。任何`node_modules/@types`内的封闭文件夹都被视为可见的，包括：
```bash
./node_modules/@types
../node_modules/@types
../../node_modues/@types
etc...
```

这个全局编译环境是指，即使不显示地导入`@types`的包，这些包的类型也能生效。 比如你安装了`@types/jquery`，然后编写：
```ts
let a: JQuery;
```
这个代码将会编译成功，因为它可以从全局环境中解析出`JQuery`的类型，它来自于`@types/jquery`。

有两个编译选项可以改变这个编译行为。

第一个是`--typeRoot`，它可以指定一个文件夹作为`@types`检查的根目录，只有这个文件夹内的包才会被加入到编译环境，不再考虑`node_modules/@types`下的包了。如：
```json
{
   "compilerOptions": {
       "typeRoots" : ["./typings"]
   }
}
```
第二个是`--types`，它可以指定一个数组，仅把指定范围内的包，加入到编译环境，而不是把所有`node_modules/@types`下的包都加入：
```json
{
   "compilerOptions": {
       "types" : ["node", "lodash", "express"]
   }
}
```
这个配置就只把`node lodash express`3个包加入当前项目的编译环境，其它`node_modules/@types`下的包则不会加入。这个选项是比较有好处的。 另外如果把`types`配置为：`[]`，则会禁用所有的`@types`相关包。

注意上面这种行为更多地是在全局范围内类型检查有意义。假如设置`types: []`，那么以下代码将不会再能检查出`JQuery`类型。
```ts
let a: JQuery;
```
但是这并不影响单独导入`JQuery`，如果我们显示导入`jquery`，则`JQuery`类型，依然能在模块中使用：
```ts
import "jquery"
let a: JQuery
```
即使`types:[]`关掉了对`@types/jquery`的自动引入。 这个例子提醒我们，`@types`的默认行为，是对全局环境生效的，但是不影响模块机制；这也充分说明，在使用ts的时候，首先要明确当前这个文件，到底是一个模块文件还是一个非模块文件，如果是一个非模块文件，意味着它的内容就是在全局范围内生效的。

**ts中的全局范围，应该是指ts全局的编译环境范围，而不是浏览器的全局环境。**

## lib与--lib
与`@types`相似的，ts默认还提供了一个`lib`库。新建一个ts项目，随便编写：
```ts
window.addEventListener(...)
```
你就能看到`addEventListener`的输入提示。 这是因为ts安装后，自带`lib`库，提前把es语言标准和web api标准的声明文件都准备好了，所以在ts项目中，就能自动识别已启用的`lib`。

从官方文档看，目前`lib`库中包含有：
```
► ES5
► ES6
► ES2015
► ES7
► ES2016
► ES2017
► ES2018
► ESNext
► DOM
► DOM.Iterable
► WebWorker
► ScriptHost
► ES2015.Core
► ES2015.Collection
► ES2015.Generator
► ES2015.Iterable
► ES2015.Promise
► ES2015.Proxy
► ES2015.Reflect
► ES2015.Symbol
► ES2015.Symbol.WellKnown
► ES2016.Array.Include
► ES2017.object
► ES2017.Intl
► ES2017.SharedMemory
► ES2017.String
► ES2017.TypedArrays
► ES2018.Intl
► ES2018.Promise
► ES2018.RegExp
► ESNext.AsyncIterable
► ESNext.Array
► ESNext.Intl
► ESNext.Symbol
```
默认值与`--target选项有关系：
```
► For --target ES5: DOM,ES5,ScriptHost
► For --target ES6: DOM,ES6,DOM.Iterable,ScriptHost
```

通过`--lib`这个编译选项可以显示地改变ts项目所要启用的`lib`:
```json
{
    "lib": [
        "DOM",
        "WebWorker"
    ]
}
```

结合`@types`来看，`lib`解决的是es和web标准层面的类型定义问题，`@types`解决的是众多js库的类型定义问题，只要这两个部分做的好，ts这个工具在使用上面就不具备阻力了，我想这也是2019年ts发展迅猛的一个重要原因。

## 声明文件
ts需要的是类型的`shape`，声明文件就是为这个设计的。不论是`@types`还是`lib`，它们给ts提供的就是类型和结构的声明，它们可以解决js运行环境和大部分第三方依赖的类型需求，但是实际项目中也不排除会遇到需要自己手写声明文件的场景。

前面写的：
```ts
declare module "foo"
```
这就是一个最简单的声明文件，而且这是一个非模块类型的声明文件。但是即使是模块中，也可以有声明：
```ts
import "jquery"
declare let $: JQueryStatic
```
所以声明的来源有四个:
* 手写的非模块文件
* 手写的模块文件
* `@types`下的包
* `lib`

声明文件中的声明怎么写，以及怎么去抽离一个已有的库的声明结构，包括如何将声明文件发布到`npm`或`@types`，这些内容是声明文件这个模块的核心。 此处不做深入介绍，本文后面的部分也许会做一些总结。

## 三斜线指令
在前面的内容中，已经看到有对三斜线指令的使用。三斜线指令是对ts编译环境类型进行补充的一个方式。它们必须位于文件顶部，它们所指定的文件或声明，将在ts编译时优先包含进编译环境。三斜线指令有三种形式：
```
/// <reference path="..." />
/// <reference type="..." />
/// <reference lib="..." />
```
它们有不同的使用场景。

1. `<reference path="..." />`
    这个指令，通过`path`指定一个`.d.ts`或`.ts`文件，这通常是ts项目中需要自己手写的声明文件所在的位置。如下这个例子：
    ```ts nest/b.d.ts
    declare namespace modB {
        interface Animal {
            name: string
        }

        function createAnimal(name: string): Animal;
    }
    ```
    ```ts a.ts
    /// <reference path="./nest/b.d.ts" />

    let dog: modB.Animal = modB.createAnimal('dog')
    ```
    这个例子中`nest/b.d.ts`中手写了对`modB`的声明，`modB`是一个通过命名空间`modB`来使用的一个模块。 `a.ts`中需要直接使用`modB`这个命名空间，但是如果不把它的声明文件加进来，直接使用`modB`会报错，所以通过`<refrence path="..." />`把`nest/b.td.ts`提前加入对`a.ts`的编译环境中。

    因为`nest/b.d.ts`是一个非模块的声明文件，它的作用范围是全局的，所以在`a.ts`中，不需要`import`直接就可以使用`modB`这个全局的明明空间名称。 如果把`nest/b.d.ts`改为:
    ```ts
    declare namespace modB {
        interface Animal {
            name: string
        }

        function createAnimal(name: string): Animal;
    }

    export {modB}
    ```
    最后的一个`export`把`nest/b.d.ts`变为了一个模块声明文件，将导致`a.ts`无法再通过`modB`这个全局空间名称直接使用`modB`，需要改为`import`:
    ```ts
    import {modB} from "./nest/b"

    let dog: modB.Animal = modB.createAnimal('dog')
    ```
    所以`<reference path="..." />`要使用的文件是不应该包含`export`的。但是也不绝对，即使是模块类型的声明文件，也可以通过`export as namespace ...`在全局范围内暴露一个名称出来，这个在声明文件的具体写法中有介绍。

    `<reference path="..." />`也是提供`ambient module`的来源，如果一个`import`语句按照`module resolution`的策略找不到模块或模块声明，则会查看文件顶部的`<reference path="..." />`所指定的声明文件中，是否有该模块的声明。如：
    ```ts nest/b.ts
    declare module "modB" {
        export interface Animal {
            name: string
        }

        export function createAnimal(name: string): Animal
    }
    ```
    ```ts a.ts
    /// <reference path="./nest/b.d.ts" />

    import * as modB from "modB"

    let v: modB.Animal = modB.createAnimal('dog')
    ```
    `<reference path="./nest/b.d.ts" />`一定需要写吗？不一定需要写。比如把`a.ts`和`nest/b.d.ts`都加入`tsconfig.json`的`files`配置中：
    ```json
    {
        "files": [
            "src/a.ts",
            "src/nest/b.d.ts"
        ],
    }
    ```
    则`nest/b.td.ts`会自动加入到ts的编译环境中，`a.ts`内即使没有明确的三斜线指令，也不影响ts找到`modB`的`ambient module`。但是从清晰角度来看，还是明确地写出三斜线指令会更好。

    这个点结合之前的`lib`和`@types`，以及模块解析策略，可以看到ts提供的编译环境，对于类型的查找范围是非常大的，它不会放弃任何一个有机会提供类型的位置。  同时也能看到在ts中区分一个文件是模块还是非模块是很重要的，它直接决定这个文件内的内容的在编译时的作用范围。

2. `<reference type="..." />`
    这个跟上面那个类似，不过它通过type属性来指定一个值，指定的是什么呢？是`@types`下的某个包的名称，这个指令通常应用于自己要发布的`package`当中。比如你开发了一个`package`，写好了它的声明文件，但是你的包，除了自己的类型，还依赖了`@types`的某些包，那么在你的声明文件里面，就可以加上这个指令，比如``<reference type="node" />``。这样别人安装了你的包，导入你的包之后，会发现其实它还需要依赖`@types/node`。它然后把`@types/node`安装以下， 你的包提供的类型结构就可以在它的ts项目中使用了。

3. `<reference lib="..." />`
    前面了解到`lib`是ts自带的类型声明库，并且可以通过`--lib`来指定ts项目要开启的`lib`。如果某些`lib`特性，仅在某个文件中启用，那么可以通过这个指令，为这个文件单独开启这个`lib`的支持。如：
    ```ts
    /// <reference lib="es2017.string" />

    "foo".padStart(4);
    ```

## tsconfig.json
这是ts的配置文件，它在的地方，将被作为ts项目编译的根目录。ts可以通过`--file --include --exclude`来配置编译的文件范围，其中`--file`要求配置文件的绝对或相对路径，不支持泛匹配；`--include --exclude`支持类似`glob`的配置方式。
> 官方说明： https://www.typescriptlang.org/docs/handbook/tsconfig-json.html#details

如果`include`配置未指定文件后缀的话，那么`.ts .d.ts .tsx`后缀的文件都会包含进去。 同时如果`--allowJs`也是`true`的话，那么`.js .jsx`后缀的文件也会加入进去。

如果`files`和`include`两个选项都没指定，那么ts会把所有允许的后缀文件都加入到编译范围内，当然除了那些被`exclude`指定排除的。所有允许的后缀包括`.ts .d.ts .tsx`，以及在`allowJs: true`时还包含：`.js .jsx`。

如果指定了`files`和`include`，那么ts的范围就是这两个的并集。通过`include`指定的文件范围，可以通过`exclude`做过滤排除。但是`files`指定的文件，无法通过`exclude`来排除。`exclude`在未指定的情况下，默认排除`node_modules/`、`bower_components/`等。 

包含在`files`和`include`中的文件，如果依赖了其他未在`files`和`include`中的文件，则也会包含进编译环境。举例来说，如果`A.ts`在`files`或`includes`中，但是`B.ts`不在，此时如果`A.ts`导入了`B.ts`，则`B.ts`也会一起编译。 而且`B.ts`通过`exclude`无法排除，因为`A.ts`需要它。除非`A.ts`也被`exclude`排除。

从这部分内容也能看到，tsconfig.json把整个文件夹都变为了编译范围，在不做范围控制的情况下，项目内满足ts后缀要求的文件，都会被它识别为编译环境的一部分。这就是为啥在vscode和webstorm中，明明没有引用某些类型，但是依然可以看到这些类型的提示，这就是这些类型正在整个项目范围内生效所导致的。

## 再看声明文件
声明文件的作用是描述代码的类型结构，也就是`shape`。但是js本身是一个弱类型的语言，在ts之前，js的动态能力一方面让它的灵活性远高于强类型语言，另一方面也因为动态特性，导致js的代码结构几乎没有太过统一的形式。 ts想出了声明文件，试图靠它描述所有非ts语言的代码结构，但是js的动态特性，让这个声明文件的编写有时变得比开发代码还要复杂。

### 写法举例
先来看看声明文件的部分场景的写法。

1. 如何声明全局变量
    注意这个全局变量，是指真的在js全局环境中运行时存在的变量。
    假如运行时代码是这样的：
    ```ts
    console.log("Half the number of widgets is " + (foo / 2));
    ```
    `foo`是一个全局变量，上述代码编译会报错，必须先声明foo变量才可使用，改为：
    ```ts
    declare var foo: number;
    console.log("Half the number of widgets is " + (foo / 2));
    ```
2. 如何声明全局函数
    跟全局变量类似：
    ```ts
    declare function greet(v: string): void;

    greet("hello, world");
    ```
3. 声明全局的带属性的对象
    ```ts
    declare namespace myLib {
        function makeGreeting(v: string) : string;
        var numberOfGreetings: number;
    }

    let result = myLib.makeGreeting("hello, world");
    console.log("The computed greeting is:" + result);

    let count = myLib.numberOfGreetings;
    ```
    此处借助`declare namespace myLib`往全局编译环境声明了一个`myLib`的命名空间。
    
4. 方法重载声明
    假如运行时代码是这样的：
    ```ts
    interface Widget {
        name?: string
    }

    let x: Widget = getWidget(43);

    let arr: Widget[] = getWidget("all of them");
    ```
    `getWidget`有两种调用形式，上述代码不存在`getWidget`，需要声明才能使用：
    ```ts
    declare function getWidget (v: number): Widget;
    declare function getWidget( v: string): Widget[];

    interface Widget {
        name?: string
    }

    let x: Widget = getWidget(43);

    let arr: Widget[] = getWidget("all of them");
    ```
5. 声明可重用的接口
    假如运行时代码是这样的：
    ```ts
    greet({
        greeting: "hello world",
        duration: 4000
    });
    ```
    添加声明后：
    ```ts
    interface GreetingSettings {
        greeting: string;
        duration?: number;
        color?: string;
    }

    declare function greet(setting: GreetingSettings): void;

    greet({
        greeting: "hello world",
        duration: 4000
    });
    ```
6. 声明可重用的别名
    假如运行时的代码是这样的：
    ```ts
    function getGreeting() {
        return "howdy";
    }
    class Greeter {
    }
    class MyGreeter extends Greeter { }

    greet("hello");
    greet(getGreeting);
    greet(new MyGreeter());
    ```
    添加声明：
    ```ts
    type GreetingLike = string | (() => string) | Greeter;

    declare function greet(g: GreetingLike): void;

    function getGreeting() {
        return "howdy";
    }
    class Greeter {
    }
    class MyGreeter extends Greeter { }

    greet("hello");
    greet(getGreeting);
    greet(new MyGreeter());
    ```
7. 将类型声组织到一起
    假如运行时代码是这样的：
    ```ts
    log({ verbose: true });
    alert({ modal: false, title: "Current Greeting" });
    ```
    这里有一个`log`和`alert`函数，他们分别接受不同结构的`options`作为参数，可以考虑把这些`options`通过命名空间组织到一起：
    ```ts
    declare function log(options: GreetingLib.Options.Log): void
    declare function alert(options: GreetingLib.Options.Alert): void

    declare namespace GreetingLib.Options {
        // Refer to via GreetingLib.Options.Log
        interface Log {
            verbose?: boolean;
        }
        interface Alert {
            modal: boolean;
            title?: string;
            color?: string;
        }
    }

    log({ verbose: true });
    alert({ modal: false, title: "Current Greeting" });
    ```
8. 声明一个类
    假如运行时代码是这样的：
    ```ts
    const myGreeter = new Greeter("hello, world");
    myGreeter.greeting = "howdy";
    myGreeter.showGreeting();

    class SpecialGreeter extends Greeter {
        constructor() {
            super("Very special greetings");
        }
    }
    ```
    要为`Greeter`添加声明：
    ```ts
    declare class Greeter {
        constructor(v: string)

        greeting: string;

        showGreeting(): void
    }

    const myGreeter = new Greeter("hello, world");
    myGreeter.greeting = "howdy";
    myGreeter.showGreeting();

    class SpecialGreeter extends Greeter {
        constructor() {
            super("Very special greetings");
        }
    }
    ```

### 代码的结构
上一个部分介绍了声明的一些写法。这个部分介绍声明文件作用的几种文件结构。

1. 全局的库结构
    在使用第三方库的时候，如果该库是通过暴露全局的变量、函数或对象来给别人使用的，那么这种库的代码结构就是全局的代码结构。ts提供了一个针对这种结构的声明文件模板可供参考：[global.d.ts](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-d-ts.html)

2. 模块化的库结构
    全局的库结构已经不太流行了，现在的库，一般都是模块化的方式组织的。模块规范目前主要由：commonjs es umd三种风格。commonjs主要在node中应用；es在哪都能应用，最终都会编译为别的；umd比较通用，即可以通过模块化方式使用，也可以通过全局环境的方式使用。

    ts提供了三种声明文件模板，来为这种模块化的库编写声明。

    第一种：[module-function.d.ts](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-function-d-ts.html)
    假如这个模块，可以通过函数的方式进行调用，比如下面的形式，就可以用这个模板：
    ```js
    var x = require("foo");
    // Note: calling 'x' as a function
    var y = x(42);
    ```

    第二种：[module-class.d.ts](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-class-d-ts.html)
    假如这个模块，可以通过`new`的方式使用，比如下面的形式，就可以用这个模板：
    ```js
    var x = require("bar");
    // Note: using 'new' operator on the imported variable
    var y = new x("hello");
    ```

    第三种：[module.d.ts](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-d-ts.html)
    假如这个模块，不能被当成函数调用，也不能被`new`构造，就可以用这个模板。

    vs 全局的库结构。 在全局的库结构中，声明文件是看不到`import`和`export`关键字的，一旦有这个了，就会被当成模块化的声明文件了，声明文件内的内容将无法暴露到全局的编译环境中。 另外在模块化的声明文件里，如果是要暴露给外部的声明，需要额外添加`export`关键字。 对比这些模板就知道了。

    另外在上面的模板中，还能见到一个声明语法， 如果一个模块化的声明文件中还想暴露出一个在全局空间都能生效的名称，可以使用：
    ```ts
    export as namespace myFuncLib;
    ```
    这应该是专门为umd模块设计的。

还有其它几种代码结构的模板，可前往官方文档查看介绍，以下是它们的模板文件：
* [module-plugin.d.ts](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-plugin-d-ts.html)
* [global-plugin.d.ts](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-plugin-d-ts.html)
* [global-modifying-module-plugin.d.ts](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-modifying-module-d-ts.html)

### 声明文件中的依赖
声明文件中如果依赖其它的声明，也是可以添加依赖。 

1. 如果你要写的声明文件是一个全局的声明文件
    全局的声明文件，要添加别的依赖，只能通过一种方式，就是：
    ```ts
    /// <reference types="someLib" />

    function getThing(): someLib.thing;
    ```
    因为全局声明文件，依赖别的声明，不能通过`import`，否则它就变为模块化的声明文件了。而且，它只能依赖其它声明文件暴露到全局编译空间的名称。它只能利用`/// <reference types="..." />`这个指令，`types`里面写其它声明文件暴露到全局编译空间的名称即可。

2. 如果你要写得声明文件是一个模块化的声明文件，并且你依赖的声明也是一个全局空间的声明
    也是利用`/// <reference types="..." />`这个指令来完成依赖：
    ```ts
    /// <reference types="moment" />

    function getThing(): moment;
    ```

3. 如果你要写得声明文件是一个模块化的声明文件，并且你依赖的声明也是一个模块化的声明
    则可以利用`import`：
    ```ts
    import * as moment from "moment";

    function getThing(): moment;
    ```

经过测试，发现`/// <reference types="..." />`，不能针对本地文件生效，改用`/// <reference path="..." />`可以依赖本地文件。 毕竟`/// <reference types="..." />`包含的还是`@types`下的包，本地文件需要用`/// <reference path="..." />`。

### 声明文件发布的位置
当你发布一个npm包时，如果有写声明文件，则声明文件可以在`package.json`的以下几个位置指定：
1. 通过`types`或`typings`这个属性来指定；
2. 跟你的包文件一起，用`file`这个属性来制定；因为当使用`files`来指定包文件时，`types`和`typings`指定的内容会被忽略。
