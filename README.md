# docx-revision-remover


> Accept all track changes in DOCX file



## Install

```
$ npm install --save docx-revision-remover
```


## Usage

```js
const remover = require('docx-revision-remover');

const src = '../src.docx'
const result = await remover(src);
//=> '/var/folders/3x/jf5977fn79jbglr7rk0tq4d00000gn/T/4049f192-43e7-43b2-98d9-094e6760861b.docx'


const src = '../src.docx'
const dst = '/home/dst.docx'
const result = await remover(src,dst);
//=> '/home/dst.docx'
```


## API

### tempfile(src,[dst])

#### src

Type: `string`

Input path


#### dst

Type: `string`

Output path


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
