
/**
 * 
 */
namespace Hat
{
	/** */
	export interface IHat
	{
		readonly head: Element;
	}
	
	/** */
	type Constructor<T = any> = 
		(abstract new (...args: any) => T) | 
		(new (...args: any) => T);
	
	/**
	 * Marks an object as a Hat, and returns a chainable
	 * function to allow the Hat to respond to signaling functions.
	 */
	export function wear(hat: IHat)
	{
		const names = getConstructorClassNames(hat);
		const hatsArray = hats.get(hat.head) || [];
		hatsArray.push(hat);
		hats.set(hat.head, hatsArray);
		(hat.head as any)._hat = hat;
		hat.head.classList.add(...names);
		
		const result = {
			wear<H extends F, F extends (...args: any[]) => void>(signal: F, handler: H)
			{
				const name = getSignalClassName(signal);
				const signalsArray = signals.get(hat.head) || [];
				signalsArray.push([signal, handler.bind(hat)]);
				signals.set(hat.head, signalsArray);
				hat.head.classList.add(name);
				return result;
			}
		};
		
		return result;
	}
	
	/**
	 * Sends a call signal to all Hats in the document that have subscribed
	 * to invokations of the specified signal function.
	 */
	export function signal<A extends any[], F extends (...args: A) => void>(ref: F, ...args: A)
	{
		const cls = getSignalClassName(ref);
		const elements = document.body.getElementsByClassName(cls);
		
		for (let i = -1; ++i < elements.length;)
		{
			const e = elements.item(i);
			if (!e)
				continue;
			
			const signalsArray = signals.get(e) || [];
			for (const [signalFunction, boundFunction] of signalsArray)
				if (signalFunction === ref)
					boundFunction(...args);
		}
	}
	
	/** */
	function getSignalClassName(fn: (...args: any) => void)
	{
		if (!fn.name)
			throw new Error("Cannot use an unnamed function as signaler");
		
		return signalPrefix + fn.name;
	}
	
	const signalPrefix = "signal:";
	
	/**
	 * @returns An array that contains all that hats that have been assigned to
	 * the specified Node.
	 */
	export function of<T extends IHat>(e: Node | null | undefined): T[];
	/**
	 * @returns The Hat of the specified Node with the specified Hat type,
	 * or null in the case when the Node is not wearing a Hat of the specified type.
	 */
	export function of<T extends IHat>(e: Node | null | undefined, type: Constructor<T>): T | null;
	export function of<T extends IHat>(e: Node | null | undefined, type?: Constructor<T>)
	{
		if (!e)
			return null;
		
		if (!type)
			return (hats.get(e as Element) || []).slice();
		
		let current: Node | null = e;
		
		for (;;)
		{
			const array = hats.get(current as Element);
			
			if (array)
				for (const obj of array)
					if (obj instanceof type)
						return obj;
			
			if (!(current.parentElement instanceof Element))
				break;
			
			current = current.parentElement;
		}
		
		return null;
	}
	
	/**
	 * Scans upward through the DOM, starting at the specified object,
	 * and performs a look-down at each layer in order to find a Hat of
	 * the specified type, which is nearest in the DOM to the specified
	 * Node or Hat.
	 * 
	 * @returns A reference to the Hat that is nearest to the specified
	 * object.
	 */
	export function nearest<T extends IHat>(
		via: Node | IHat,
		type: Constructor<T>)
	{
		let current: Node | null = via instanceof Node ? via : via.head;
		
		while (current instanceof Node)
		{
			if (current instanceof Element)
			{
				const maybe = Hat.down(current, type);
				if (maybe)
					return maybe;
			}
			current = current.parentElement;
		}
		
		return null;
	}
	
	/**
	 * Scans upward through the DOM, starting at the specified Node, 
	 * looking for the first element wearing a Hat of the specified type.
	 * 
	 * @returns A reference to the Hat that exists above the specified Node
	 * in the DOM, or null if no such Hat was found.
	 */
	export function up<T extends IHat>(
		via: Node | IHat,
		type: Constructor<T>)
	{
		let current: Node | null = via instanceof Node ? via : via.head;
		
		while (current instanceof Node)
		{
			if (current instanceof Element)
			{
				const hat = Hat.of(current, type);
				if (hat)
					return hat;
			}
			current = current.parentElement;
		}
		
		return null;
	}
	
	/**
	 * Finds the first descendent element that has an attached Hat of the
	 * specified type, that exists underneath the specified Node or Hat.
	 * 
	 * @returns The Hat associated with the descendent element, or
	 * null if no such Hat is found.
	 */
	export function down<T extends IHat>(via: Node | IHat, type: Constructor<T>)
	{
		const hats = within(via, type, true);
		return hats.length > 0 ? hats[0] : null;
	}
	
	/**
	 * Scans upward through the DOM, starting at the specified Node, 
	 * looking for the first element wearing a Hat of the specified type.
	 * 
	 * @throws An exception if no Hat of the specified type is found.
	 * @returns The ancestor Hat of the specified type.
	 */
	export function over<T extends IHat>(
		via: Node | IHat,
		type: Constructor<T>)
	{
		const hat = up(via, type);
		if (!hat)
			throw new Error("Hat not found.");
		
		return hat;
	}
	
	/**
	 * Finds all descendent elements that have an attached Hat of the
	 * specified type, that exist underneath the specified Node or Hat.
	 * 
	 * @returns An array of Hats whose type matches the type specified.
	 */
	export function under<T extends IHat>(via: Node | IHat, type: Constructor<T>)
	{
		return within(via, type, false);
	}
	
	/**
	 * Returns an array of Hats of the specified type,
	 * which are extracted from the specified array of elements.
	 */
	export function map<T extends IHat>(elements: Element[], type: Constructor<T>): T[];
	export function map<T extends IHat>(elementContainer: Element | IHat, type: Constructor<T>): T[];
	export function map<T extends IHat>(e: IHat | Element | Element[], type: Constructor<T>): T[]
	{
		e = (!(e instanceof Element) && !window.Array.isArray(e)) ? e.head : e;
		const elements = e instanceof Element ? window.Array.from(e.children) : e;
		return elements
			.map(e => of(e, type))
			.filter((o): o is T => o instanceof type);
	}
	
	/**
	 * Returns the element succeeding the specified element in
	 * the DOM that is connected to a hat of the specified type.
	 */
	export function next<T extends IHat>(via: Element | IHat, type: Constructor<T>): T | null
	{
		via = via instanceof Element ? via : via.head;
		
		for (;;)
		{
			via = via.nextElementSibling as Element;
			if (!(via instanceof Element))
				return null;
			
			const hat = of(via, type);
			if (hat)
				return hat;
		}
	}
	
	/**
	 * Returns the element preceeding the specified element in the DOM
	 * that is connected to a hat of the specified type.
	 */
	export function previous<T extends IHat>(via: Element | IHat, type: Constructor<T>): T | null
	{
		via = via instanceof Element ? via : via.head;
		
		for (;;)
		{
			via = via.previousElementSibling as Element;
			if (!(via instanceof Element))
				return null;
			
			const hat = of(via, type);
			if (hat)
				return hat;
		}
	}
	
	/** */
	function within<T extends IHat>(via: Node | IHat, type: Constructor<T>, one: boolean)
	{
		const e = 
			via instanceof Element ? via : 
			via instanceof Node ? via.parentElement :
			via.head;
		
		if (!e)
			throw "Cannot perform this method using the specified node.";
		
		const names = ctorNames.get(type);
		
		// If there is no class name found for the specified hat type,
		// this could possibly be an error (meaning that the hat type
		// wasn't registered). But it could also be a legitimate case of the
		// hat simply not having been registered at the time of this
		// function being called.
		if (!names || names.length === 0)
			return [];
		
		const descendents = names.length === 1 ? 
			e.getElementsByClassName(names[0]) :
			e.querySelectorAll(names.map(n => "." + n).join());
		
		const hats: T[] = [];
		const len = one && descendents.length > 0 ? 1 : descendents.length;
		
		for (let i = -1; ++i < len;)
		{
			const descendent = descendents[i];
			const hat = Hat.of(descendent, type);
			if (hat)
				hats.push(hat);
		}
		
		return hats;
	}
	
	/** */
	function childrenOf<T extends IHat>(e: Element, hatType?: Constructor<T>)
	{
		let children = globalThis.Array.from(e.children);
		
		if (hatType)
			children = children.filter(e => Hat.of(e, hatType));
		
		return children;
	}
	
	/**
	 * Returns a unique CSS class name that corresponds to the type
	 * of the object.
	 */
	function getConstructorClassNames(object: object)
	{
		const existingNames = ctorNames.get(object.constructor);
		if (existingNames)
			return existingNames;
		
		const ctors: any[] = [object.constructor];
		const names: string[] = [];
		
		for (;;)
		{
			const ctor = ctors[ctors.length - 1];
			const next = Object.getPrototypeOf(ctor);
			if (next === null || next === Object || next === Function)
				break;
			
			ctors.push(next);
		}
		
		for (const ctor of ctors)
		{
			let name = ctor.name || "";
			
			if (name.length < 3)
				name = "_hat_" + name + (++inc);
			
			names.push(name);
		}
		
		for (let i = ctors.length; i-- > 0;)
		{
			const ctor = ctors[i];
			if (!ctorNames.has(ctor))
				ctorNames.set(ctor, names.slice(i));
		}
		
		return names;
	}
	
	const ctorNames = new WeakMap<Function, string[]>();
	const hats = new WeakMap<Element, object[]>();
	const signals = new WeakMap<object, [Function, Function][]>();
	let inc = 0;
	
	/**
	 * 
	 */
	export class Array<THat extends IHat = IHat>
	{
		/** */
		constructor(
			private readonly parentElement: Element,
			private readonly hatType: Constructor<THat>)
		{
			this.marker = document.createComment("");
			parentElement.append(this.marker);
		}
		
		private readonly marker: Comment;
		
		/** */
		* [Symbol.iterator]()
		{
			for (let i = -1; ++i < this.parentElement.children.length;)
			{
				const child = this.parentElement.children.item(i);
				if (child)
				{
					const hat = Hat.of(child, this.hatType);
					if (hat)
						yield hat;
				}
			}
		}
		
		/** */
		map(): THat[];
		map<T>(mapFn: (value: THat, index: number, array: THat[]) => T): T[];
		map(mapFn?: (value: THat, index: number, array: THat[]) => any)
		{
			const elements = childrenOf(this.parentElement, this.hatType);
			const hats = Hat.map(elements, this.hatType);
			return mapFn ? hats.map(mapFn) : hats;
		}
		
		/** */
		at(index: number)
		{
			return this.map().at(index) || null;
		}
		
		/** */
		insert(...hats: THat[]): number;
		insert(index: number, ...hats: THat[]): number;
		insert(a: number | THat, ...newHats: THat[])
		{
			const index = typeof a === "number" ? (a || 0) : -1;
			const existingHats = this.map();
			
			if (typeof a === "object")
				newHats.unshift(a);
			
			if (newHats.length === 0)
				return;
			
			if (existingHats.length === 0)
			{
				this.parentElement.prepend(...newHats.map(c => c.head));
			}
			else
			{
				const target = index >= existingHats.length ? 
					(existingHats.at(index) as IHat).head :
					this.marker;
				
				for (const hat of newHats)
					this.parentElement.insertBefore(hat.head, target);
			}
			
			return index < 0 ? existingHats.length + newHats.length : index;
		}
		
		/** */
		move(fromIndex: number, toIndex: number)
		{
			const children = childrenOf(this.parentElement, this.hatType);
			const target = children.at(toIndex);
			const source = children.at(fromIndex);
			
			if (source && target)
				target.insertAdjacentElement("beforebegin", source);
		}
		
		/** */
		indexOf(hat: THat)
		{
			const children = childrenOf(this.parentElement, this.hatType);
			for (let i = -1; ++i < children.length;)
				if (children[i] === hat.head)
					return i;
			
			return -1;
		}
		
		/** */
		get length()
		{
			return childrenOf(this.parentElement, this.hatType).length;
		}
		
		/** */
		observe(callback: (mut: MutationRecord) => void)
		{
			if (this.observers.length === 0)
			{
				const mo = new MutationObserver(mutations =>
				{
					for (const mut of mutations)
						for (const fn of this.observers)
							fn(mut);
				});
				
				mo.observe(this.parentElement, { childList: true });
			}
			
			this.observers.push(callback);
		}
		
		private readonly observers: ((mut: MutationRecord) => void)[] = [];
		
		/** */
		private toJSON()
		{
			return this.map();
		}
	}
}

//@ts-ignore CommonJS compatibility
if (typeof module === "object") Object.assign(module.exports, { Hat });

// ES module compatibility
declare module "hatjs"
{
	const __export: { Hat: typeof Hat };
	export = __export;
}

// The comment and + prefix is removed during npm run bundle
//+ export { Hat }
