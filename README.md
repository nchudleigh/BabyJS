# BabyJS 👶
### A really stupid little baby library for rendering DOM

Pretty Small. (200 lines of source)

Supports :if, :each and {{variables}}

```html
<div id="main">
    <div :if="this.name">
        {{this.name}}
    </div>
    <div :each="letter in this.name">
        {{letter}}
    </div>
</div>
```
```js
var b = new Baby('main', {name:'Violet'});
```
