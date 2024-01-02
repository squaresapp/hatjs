
# HatJS - Utility Functions For Anonymous Controller Classes

HatJS is a library designed to support the Anonymous Controller Class (ACC) pattern. Technically, you don't need any library to implement this pattern into your code, but using HatJS adds some helpful utility functions that allow you to easily discover and manipulate the anonymous controllers that are associated with a given HTML element.

## Installation

From jsDelivr:
```html
<script src="https://cdn.jsdelivr.net/npm/@squaresapp/hatjs/hat.min.js"></script>
```
Typings
```
npm install @squaresapp/hatjs
```

## What are Anonymous Controller Classes?

Anonymous Controller Classes are a code pattern for organizing vanilla JS apps into a coherent structure. They're classes that wrap the root HTML element of a component, and provide a place for the backing logic that supports its operation. 

Below is an example of an Anonymous Controller Class in action:

```typescript
class SomeComponent {
	readonly head;
	
	constructor() {
		this.head = document.createElement("div");
		this.head.addEventListener("click', () => this.click());
		// Probably do some other stuff to this.head
	}
	
	private handleClick() {
		alert("Clicked!")
	}
}
```

ACCs are classes that create and wrap a root element, which possibly may container other nested elements, with event listeners connected, styling assigned, etc. They have methods which are typically event handlers or other helper methods. You then instanitate the component, and add the component's .head element to the DOM:

```typescript
const component = new SomeComponent();
document.body.append(component.head);
```

The class is considered "anonymous" because you can discard your instance of the component as soon as its attached to the DOM. The instance of the class will be garbage collected as soon as the element is removed from the DOM and garbage collected. For example:

```typescript
class SomeComponent {
	readonly head;
	
	constructor() {
		this.head = document.createElement("div");
		this.head.addEventListener("click', () => this.remove());
		// Probably do some other stuff to this.head
	}
	
	private remove() {
		// Remove the component's .head element from the DOM,
		// which will by extension garbage collect this instance of
		// SomeComponent.
		this.head.remove();
	}
}
```

ACCs impose no restrictions on you. They can inherit from anything (or nothing). They're just an idea––you can mold them to behave however you like.

There are many scenarios when you might want to get the ACC associated with a particular element. For example, imagine iterating through the ancestor elements of the this.head element, and getting the ACCs associated with it in order to invoke some public method. **This is where HatJS comes in**.

## HatJS Utility Functions 

The HatJS library is a stateless library of utility functions that allow you to inspect the ACCs associated with an element, and send various signals between them.

`Hat.wear(object)` - Marks an object as a Hat. (Or formally–an "Anonymous Controller Class").

`Hat.of(element, HatType)` - Gets a hat, optionally of a specified type, that is associated with the specified element.

`Hat.nearest(element, HatType)` - Returns a reference to the Hat that is nearest in the DOM to the specified element.

`Hat.up(element, HatType)` - Scans upward through through the DOM, starting at the specified element, until it finds a Hat of the specified type. (Can return null)

`Hat.down()` - Finds the first descendent element that has an attached Hat of the specified type, that exists underneath the specified Node (or Hat).

`Hat.over()` -  Scans upward through the DOM, starting at the specified Node, looking for the first element wearing a Hat of the specified type. (Throws an exception)

`Hat.under()` - Finds all descendent elements that have an attached Hat of the specified type, that exist underneath the specified Node or Hat.
