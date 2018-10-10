# vdom

## Features

* Virtual DOM with diff and patching
* API uses [Symbolic Expressions](https://en.wikipedia.org/wiki/S-expression)
* Children keys
* SVGs
* DOM Events
* Lifecycle functions (componentDidMount, componentDidUpdate, componentWillUnmount, componentDidUnmount)

## Example

```js
import { render } from './index';

const App = () => ['div',
  ['div', { style: { color: 'tomato' } }, 'some text!'],
];
const AppUpdate = () => ['div',
  ['div', { style: { color: 'limegreen' } }, 'some updated text!'],
];

render(App, document.body);
render(AppUpdate, document.body);
```

## Requirements

* node

## Test

```bash
yarn test
```

## Build

```bash
yarn build
```
