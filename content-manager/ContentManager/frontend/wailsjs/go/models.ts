export namespace nostr {
	
	export class Event {
	    ID: string;
	    PubKey: string;
	    CreatedAt: number;
	    Kind: number;
	    Tags: string[][];
	    Content: string;
	    Sig: string;
	
	    static createFrom(source: any = {}) {
	        return new Event(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.PubKey = source["PubKey"];
	        this.CreatedAt = source["CreatedAt"];
	        this.Kind = source["Kind"];
	        this.Tags = source["Tags"];
	        this.Content = source["Content"];
	        this.Sig = source["Sig"];
	    }
	}

}

