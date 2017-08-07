function Baby(mount, state) {
    var tmp_tkn_rgx = /{{.*?}}/g
    this.mount = document.getElementById(mount);
    this.state = state;
    this.vdom = {};
    this.sdom = '';


    this.genId = function() {
        return Math.floor((Math.random() * 99999));
    }

    this.readNode = function(node) {
        var rv = {};

        // Tag Name
        var type = node.tagName?String(node.tagName).toLowerCase():node.nodeType;

        var content = node.textContent?node.textContent:'';
        if (type == 3){
            content = content.replace(/\s+/g, '')
            type = 'text'
        }
        if (content.length == 0) return;

        rv.type = type

        rv.content = node.textContent.trim();

        // generate an ID for this node
        rv.id = type + '_' + this.genId();

        // Attributes
        rv.attrs = {}

        if (node.attributes){
            for(var a=0; a<node.attributes.length; a++) {
                var attr = node.attributes[a]
                rv.attrs[attr.nodeName] = attr.nodeValue;
            }
        }

        for(var c=0; c < node.childNodes.length; c++) {
            // referencing the current child
            var child = node.childNodes[c];
            // documenting that child in json
            var newNode = this.readNode(child);
            if (!newNode){
                continue;
            }
            // adding a reference to the parent
            newNode.parId = rv.id;
            // keeping the position relative to the parent
            newNode.parIdx = c;
            // saving the DOM node to the vdom
            this.vdom[newNode.id] =  newNode;

        }
        return rv;
    }

    this.buildNode = function(node) {

        if(node.attrs[':if']) {
            try {
                var if_rv = this.evalContext(node.attrs[':if']);
                // dont render if false
                if (!if_rv) return '';
            } catch (e) {
                console.warn(e);
            }
        }

        var each_iter = [];
        var each_var;
        if(node.attrs[':each']) {
            try {
                // item in this.items
                each_iter = node.attrs[':each'].split(' in ');

                each_var = each_iter[0];
                each_iter = each_iter[1];

                each_iter = this.evalContext(each_iter);

            } catch (e) {
                console.warn(e);
            }
        }

        var child_elements = [];
        for( var n in this.vdom ){
            var child = this.vdom[n];

            var child_element;

            if (child.parId == node.id){
                child_element = this.buildNode(child);
                child_elements[child.parIdx] = child_element;
            }
        }

        var element = '';
        // construct opening tag
        if (node.type != 'text') {
            element = '<' + node.type;

            var attrs = '';
            for(var attr_key in node.attrs) {
                var attr_value = node.attrs[attr_key];
                attrs = attrs + ' ' + attr_key + '="'+attr_value+'"';
            }

            element = element + attrs + '>';
        }


        if (node.content &&  node.type == 'text') {
            element = element + node.content;
        }


        element = element + child_elements.join('');

        if (node.type != 'text'){
            element = element + '</' + node.type + '>';
        }

        var iter_elem = element;
        if (each_iter && each_iter.length) {
            for(var i in each_iter) {
                element = element + this.injectToken(iter_elem, each_var, each_iter[i]);
            }
        }


        return element;
    }

    this.evalContext = function(js) {
        var rv;
        (function () {rv = eval(js)}).call(this.state, js);
        return rv;
    }

    this.evalToken = function(token) {
        var rv = ''
        try {
            rv = this.evalContext(token);
        } catch (e) {
            console.warn(e);
        } finally {
            return rv;
        }
    }

    function rgxEsc(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };

    this.injectToken = function(input, token, value) {
        var rv = input;
        // evaluate and replace tokens
        var tok_esc = rgxEsc(token);
        var tok_rgx = '{{\\s*' + tok_esc + '\\s*}}';
        tok_rgx = new RegExp(tok_rgx, "g");
        rv = rv.replace(tok_rgx, value);
        return rv;

    }

    this.injectTokens = function(input) {
        var uniq = {};
        var matches = input.match(tmp_tkn_rgx);
        var rv = input;

        // de dupe the tokens
        for(var m in matches){
            var match = matches[m];
            match = match.replace('{{','').replace('}}', '').trim();
            uniq[match] = true;
        }

        // evaluate and replace tokens
        for (var tok in uniq){
            rv = this.injectToken(rv, tok, this.evalToken(tok));
        }

        return rv;
    }

    this.mount_node = this.readNode(this.mount)

    this.vdom[this.mount_node.id] = this.mount_node;

    this.sdom = this.buildNode.call(this, this.mount_node)

    this.sdom = this.injectTokens(this.sdom)

    this.mount.innerHTML = this.sdom;
}
