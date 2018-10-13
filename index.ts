import { call, all, factory, Effect, NextFn, TaskFn } from 'cofx';

interface Style {
  [key: string]: any;
}

type VElementType = 'tag' | 'text';
type DOMElement = HTMLElement | SVGSVGElement;
interface VElement {
  tag: string;
  text?: string | number;
  dom: DOMElement | Text;
  props: IProps;
  type: VElementType;
}

type VChildren = VElement[];

interface IProps {
  className?: string;
  style?: Style;
  children?: VChildren;
  key?: string;
  [key: string]: any;
}

interface IComponentProps {
  className?: string;
  style?: Style;
  children?: VChildren | string | number;
  [key: string]: any;
}
type IPureComponent = (props: IComponentProps) => VElement;
type IComponent = IPureComponent;

type ITag = string | IComponent;

interface ICreateElement {
  tag: ITag;
  props?: IProps;
  children?: VElement[] | string | number;
  [key: string]: any;
}
interface ICreateTextElement {
  text: string | number;
  props?: IProps;
}

interface SymbolicExpressions extends Array<any> {
  [0]: ITag;
  [1]: IProps | string | number | SymbolicExpressions;
  [2]?: string | number | SymbolicExpressions;
}

interface Obj {
  [key: string]: string | number;
}
type Value = string | number | boolean | Obj;
interface DynamicHTMLElement extends HTMLElement {
  [key: string]: any;
}
interface DynamicSVGElement extends SVGSVGElement {
  [key: string]: any;
}

// type Render = any[] | VElement;
type Fn = (...args: any[]) => void;
type LifeCycle = Fn[];

const XLINK_NS = 'http://www.w3.org/1999/xlink';
const SVG_NS = 'http://www.w3.org/2000/svg';

const CONTEXT = 'CONTEXT';
export const context = (fn: Fn, ...args: any[]) => ({
  type: CONTEXT,
  fn,
  args,
});
function contextEffect({ fn, args }: { fn: Fn; args: any[] }, state: any) {
  const result = fn(state, ...args);
  return Promise.resolve(result);
}

function handler(effect: Effect, state: any) {
  if (effect && effect.type === CONTEXT) {
    return contextEffect(effect as any, state);
  }
  return effect;
}
function middleware(state: any) {
  return (next: NextFn) => (effect: Effect) => {
    const nextEffect = handler(effect, state);
    return next(nextEffect);
  };
}

// const isElement = (el: any) => el && el.type;
const isTextElement = (el: any) => el && el.type === 'text';
const getKey = (node: VElement) => {
  if (node && node.props) {
    return node.props.key;
  }

  return null;
};

export const createKeyMap = (element: VElement, node: any) => {
  const { children } = element.props;
  const out: { [key: string]: any } = {};
  children.forEach((child: VElement, index: number) => {
    const key = getKey(child);
    if (!key) {
      return;
    }
    out[key] = {
      element: child,
      node: node.children[index],
    };
  });
  return out;
};

export function createTextElement({
  text,
  props = {},
}: ICreateTextElement): VElement {
  return {
    type: 'text',
    tag: 'text',
    text,
    props,
    dom: null,
  };
}

export function* createElement({
  tag,
  props = {},
  children = [],
}: ICreateElement) {
  if (typeof tag === 'function') {
    const el = yield call(tag, { ...props, children });
    return el;
  }

  if (typeof children === 'string' || typeof children === 'number') {
    const el = yield call(createElement, {
      tag,
      props,
      children: [createTextElement({ text: children })],
    });
    return el;
  }

  return {
    type: 'tag',
    tag,
    dom: null,
    props: {
      ...props,
      children,
    },
  };
}
export const h = createElement;

function* transformChildrenToElements(
  el: string | number | SymbolicExpressions[] | ITag,
) {
  if (Array.isArray(el)) {
    if (typeof el[0] === 'string' || typeof el[0] === 'function') {
      const els = yield call(transformSExpToElement, el as SymbolicExpressions);
      return [els];
    } else {
      const els = yield all(el.map((e) => call(transformSExpToElement, e)));
      return els;
    }
  }

  if (typeof el === 'function') {
    const els = yield call(transformSExpToElement, [el] as any);
    return [els];
  }

  const text: string | number = el;
  return [createTextElement({ text })];
}

function* transformSExpToElement(
  el: SymbolicExpressions | string | number | VElement,
) {
  if (!Array.isArray(el)) {
    return el as VElement;
  }

  let ele = null;
  if (el.length === 1) {
    ele = yield call(createElement, { tag: el[0] });
  } else if (el.length === 2) {
    if (
      typeof el[1] === 'string' ||
      typeof el[1] === 'number' ||
      Array.isArray(el[1]) ||
      typeof el[1] === 'function'
    ) {
      const children = yield call(
        transformChildrenToElements,
        el[1] as SymbolicExpressions,
      );
      ele = yield call(createElement, { tag: el[0], children });
    } else {
      ele = yield call(createElement, { tag: el[0], props: el[1] });
    }
  } else if (el.length === 3) {
    const children = yield call(transformChildrenToElements, el[2]);
    ele = yield call(createElement, {
      tag: el[0],
      props: el[1] as IProps,
      children,
    });
  }

  if (Array.isArray(ele)) {
    const resp = yield call(transformSExpToElement, ele);
    return resp;
  }

  return ele;
}

function componentDidMount(
  fn: (node: DOMElement) => void,
  lifecycle: LifeCycle,
  node: DOMElement,
) {
  if (!fn) {
    return;
  }

  lifecycle.push(() => {
    fn(node);
  });
}

function componentDidUpdate(
  fn: (node: DOMElement, p: IProps) => void,
  lifecycle: LifeCycle,
  node: DOMElement,
  lastProps: IProps,
) {
  if (!fn) {
    return;
  }

  lifecycle.push(() => {
    fn(node, lastProps);
  });
}

function componentWillUnmount(
  fn: (node: DOMElement) => void,
  node: DOMElement,
) {
  if (!fn) {
    return;
  }

  fn(node);
}

function componentDidUnmount(
  fn: (node: DOMElement, r: () => void) => void,
  node: DOMElement,
  remove: () => void,
) {
  if (!fn) {
    remove();
    return;
  }

  fn(node, remove);
}

function updateDomProps(
  node: DOMElement,
  curProps: any,
  nextProps: any,
  lifecycle: LifeCycle,
  isRecycled: boolean,
) {
  const props = { ...curProps, ...nextProps };
  for (const name in props) {
    updateProp(node, name, curProps[name], nextProps[name]);
  }

  if (isRecycled) {
    componentDidUpdate(nextProps.componentDidUpdate, lifecycle, node, curProps);
  } else {
    componentDidMount(props.componentDidMount, lifecycle, node);
  }
}

const eventProxy = (event: any) =>
  event.currentTarget.events[event.type](event);

function updateProp(
  node: DynamicHTMLElement | DynamicSVGElement,
  name: string,
  curValue: Value,
  nextValue: Value,
) {
  const ignoreAttributes = ['key', 'children'];
  const mustSetAttribute = ['list', 'draggable', 'spellcheck', 'translate'];

  if (ignoreAttributes.indexOf(name) >= 0) {
    return;
  }

  if (curValue === nextValue) {
    return;
  }

  if (name === 'style') {
    updateStyles(node, curValue as Obj, nextValue as Obj);
  } else if (name[0] === 'o' && name[1] === 'n') {
    if (!node.events) {
      node.events = {};
    }

    const eventName = name.toLocaleLowerCase();
    const eventNameType = eventName.slice(2);
    node.events[eventNameType] = nextValue;

    if (!nextValue) {
      node.removeEventListener(eventNameType, eventProxy);
    } else if (!curValue) {
      node.addEventListener(eventNameType, eventProxy);
    }
  } else {
    const isEmpty =
      nextValue == null ||
      nextValue === false ||
      typeof nextValue === 'undefined';
    const ns = name.replace('xlink:', '');
    const isXLink = name !== ns;

    if (isXLink) {
      if (isEmpty) {
        node.removeAttributeNS(XLINK_NS, ns);
      } else {
        node.setAttributeNS(XLINK_NS, name, `${nextValue}`);
      }
    } else if (name in node && mustSetAttribute.indexOf(name) === -1) {
      node[name] = nextValue == null ? '' : `${nextValue}`;
      if (isEmpty) {
        node.removeAttribute(name);
      }
    } else {
      if (isEmpty) {
        node.removeAttribute(name);
      } else {
        node.setAttribute(name, `${nextValue}`);
      }
    }
  }
}

function updateStyles(node: DOMElement, curStyle: Obj, nextStyle: Obj) {
  const styles = { ...curStyle, ...nextStyle };
  Object.keys(styles).forEach((key) => {
    const value = styles[key] || '';
    node.style[key as any] = value as any;
  });
}

function createDomElement(element: VElement): DOMElement | Text {
  if (isTextElement(element)) {
    return document.createTextNode(`${element.text}`);
  }

  if (element.tag === 'svg') {
    return document.createElementNS(SVG_NS, 'svg');
  }

  return document.createElement(element.tag);
}

function removeDomChildren(node: DOMElement, element: VElement) {
  const { children } = element.props;
  if (children) {
    children.forEach((child, index) => {
      removeDomChildren(node.children[index] as DOMElement, child);
    });
  }

  componentWillUnmount(element.props.componentWillUnmount, node);
}

function removeDomElement(
  parent: DOMElement,
  node: DOMElement,
  element: VElement,
) {
  const remove = () => {
    removeDomChildren(node, element);
    parent.removeChild(node);
  };

  componentDidUnmount(element.props.componentDidUnmount, node, remove);
}

// function asyncCreateDom(element: VElement, lifecycle: LifeCycle) {}

function createDom(element: VElement, lifecycle: LifeCycle): DOMElement | Text {
  const { props } = element;

  const domNode = createDomElement(element);
  element.dom = domNode;

  if (isTextElement(element)) {
    return domNode;
  }

  updateDomProps(domNode as DOMElement, {}, props, lifecycle, false);

  if (props && props.children) {
    const children = props.children as VElement[];
    children.forEach((child) => {
      domNode.appendChild(createDom(child, lifecycle));
    });
  }

  return domNode;
}

function asyncPatchDom(
  curElement: VElement,
  nextElement: VElement,
  parent: DOMElement,
  node: DOMElement,
  lifecycle: LifeCycle,
  task: TaskFn<any>,
) {
  window.requestAnimationFrame(() => {
    patchDom(curElement, nextElement, parent, node, lifecycle, task);
  });
}

function patchDom(
  curElement: VElement,
  nextElement: VElement,
  parent: DOMElement,
  node: DOMElement,
  lifecycle: LifeCycle,
  task: TaskFn<any>,
): DOMElement {
  if (curElement && !nextElement) {
    removeDomElement(parent, node, curElement);
    return;
  }

  if ((!curElement && nextElement) || !node) {
    parent.appendChild(createDom(nextElement, lifecycle));
    return;
  }

  if (curElement === nextElement) {
  } else if (isTextElement(curElement) && isTextElement(nextElement)) {
    node.nodeValue = `${nextElement.text}`;
  } else if (!isTextElement(curElement) && !isTextElement(nextElement)) {
    const curChildren = curElement.props.children as VElement[];
    const nextChildren = nextElement.props.children as VElement[];
    const keyMap = createKeyMap(curElement, node);

    if (nextChildren.length < curChildren.length) {
      // previous children is larger than new children
      const nextKeyMap = createKeyMap(nextElement, node);
      curChildren.forEach((curChild, index) => {
        const curKey = getKey(curChild);
        const nextChild = nextKeyMap[curKey];
        if (!nextChild) {
          asyncPatchDom(
            curChild,
            nextChild,
            node,
            node.children[index] as DOMElement,
            lifecycle,
          );
        }
      });
    }

    let curIndex = 0;
    nextChildren.forEach((nextChild, index) => {
      const nextKey = getKey(nextChild);
      const curKey = getKey(curChildren[index]);
      const curChild = keyMap[nextKey];
      if (curChild) {
        if (node.children.length > curIndex) {
          node.insertBefore(curChild.node, node.children[curIndex]);
          asyncPatchDom(
            curChild.element,
            nextChild,
            node,
            node.children[curIndex] as DOMElement,
            lifecycle,
          );
        }
      } else if (curKey) {
        const domNode = createDom(nextChild, lifecycle);
        node.insertBefore(domNode, node.children[curIndex]);
        curIndex += 1;
      } else if (node.children.length > curIndex) {
        asyncPatchDom(
          curChildren[index],
          nextChild,
          node,
          node.children[curIndex] as DOMElement,
          lifecycle,
        );
      } else {
        asyncPatchDom(
          curChildren[index],
          nextChild,
          node,
          node.firstChild as DOMElement,
          lifecycle,
        );
      }

      curIndex += 1;
    });
  } else {
    const domNode = createDom(nextElement, lifecycle);
    parent.insertBefore(domNode, node);
    removeDomElement(parent, node, curElement);
  }

  nextElement.dom = node;

  if (!isTextElement(nextElement)) {
    updateDomProps(node, curElement.props, nextElement.props, lifecycle, true);
  }

  return node;
}

export function renderFactory(...otherMiddleware: any[]) {
  let curElement: VElement = null;
  return (el: any, nextNode: DOMElement, state?: any) => {
    const task = factory(middleware(state), ...otherMiddleware);
    return task(transformSExpToElement, el as SymbolicExpressions).then(
      (nextElement: VElement) => {
        // console.log(JSON.stringify(nextElement, null, 2));
        patch(curElement, nextElement, nextNode, task);
        curElement = nextElement;
      },
    );
  };
}

export const render = renderFactory();

export function patch(
  curElement: VElement,
  nextElement: VElement,
  root: DOMElement,
  task: TaskFn<any>,
) {
  const lifecycle: LifeCycle = [];
  const node = root ? root.firstChild : null;

  asyncPatchDom(
    curElement,
    nextElement,
    root,
    node as DOMElement,
    lifecycle,
    task,
  );

  lifecycle.forEach((fn) => {
    fn();
  });

  return node;
}
