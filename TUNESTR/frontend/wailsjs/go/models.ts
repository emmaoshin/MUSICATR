export namespace main {
	
	export class UserPreferences {
	    theme: string;
	
	    static createFrom(source: any = {}) {
	        return new UserPreferences(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	    }
	}
	export class LastImage {
	    path: string;
	    timestamp: number;
	
	    static createFrom(source: any = {}) {
	        return new LastImage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.timestamp = source["timestamp"];
	    }
	}
	export class FileInfo {
	    path: string;
	    name: string;
	    ext: string;
	    size: number;
	    modTime: string;
	
	    static createFrom(source: any = {}) {
	        return new FileInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.ext = source["ext"];
	        this.size = source["size"];
	        this.modTime = source["modTime"];
	    }
	}
	export class AppState {
	    selectedFiles: FileInfo[];
	    lastImage?: LastImage;
	    preferences: UserPreferences;
	
	    static createFrom(source: any = {}) {
	        return new AppState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.selectedFiles = this.convertValues(source["selectedFiles"], FileInfo);
	        this.lastImage = this.convertValues(source["lastImage"], LastImage);
	        this.preferences = this.convertValues(source["preferences"], UserPreferences);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	

}

