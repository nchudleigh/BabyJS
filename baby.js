function Baby(mount, state) {
    this.state = state;

    var self = this;
    var tmp_tkn_rgx = /{{.*?}}/g
    var mount = document.getElementById(mount);
    var vdom = {};


    function genId() {
        return Math.floor((Math.random() * 99999));
    }


    function readNode(node) {
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
        rv.id = type + '_' + genId();

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
            var newNode = readNode(child);
            if (!newNode){
                continue;
            }
            // adding a reference to the parent
            newNode.parId = rv.id;
            // keeping the position relative to the parent
            newNode.parIdx = c;
            // saving the DOM node to the vdom
            vdom[newNode.id] =  newNode;

        }
        return rv;
    }

    function buildNode(node) {
        if(node.attrs[':if']) {
            try {
                var if_rv = evalContext(node.attrs[':if']);
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
                // item in this.state.items
                each_iter = node.attrs[':each'].split(' in ');

                each_var = each_iter[0];
                each_iter = each_iter[1];

                each_iter = evalContext(each_iter);

            } catch (e) {
                console.warn(e);
            }
        }

        var child_elements = [];
        for( var n in vdom ){
            var child = vdom[n];

            var child_element;

            if (child.parId == node.id){
                child_element = buildNode(child);
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
                element = element + injectToken(iter_elem, each_var, each_iter[i]);
            }
        }
        return element;
    }

    function evalContext(js) {
        var rv;
        (function () {rv = eval(js)}).call(self.state, js);
        return rv;
    }

    function evalToken(token) {
        var rv = ''
        try {
            rv = evalContext(token);
        } catch (e) {
            console.warn(e);
        } finally {
            return rv;
        }
    }

    function rgxEsc(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };

    function injectToken(input, token, value) {
        var rv = input;
        // evaluate and replace tokens
        var tok_esc = rgxEsc(token);
        var tok_rgx = '{{\\s*' + tok_esc + '\\s*}}';
        tok_rgx = new RegExp(tok_rgx, "g");
        rv = rv.replace(tok_rgx, value);
        return rv;
    }

    function injectTokens(input) {
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
            rv = injectToken(rv, tok, evalToken(tok));
        }
        return rv;
    }

    function render(root) {
        // Build the string representation of the vdom starting at the root
        var sdom = buildNode(root);
        // inject tokens into the string and update from the mount point
        mount.innerHTML = injectTokens(sdom);
    };

    this.set = function(name, value) {
        try {
            this.state[name] = value;
            console.log(root);
            render(root);
        } catch (e) {
            console.warn(e);
        }
    }
    var root = readNode(mount);
    render(root);
}
