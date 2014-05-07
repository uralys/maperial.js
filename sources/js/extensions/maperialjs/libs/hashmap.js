
function HashMap(){
    this.array = [];
}

HashMap.prototype.put = function(key, value) {
    var index = this.getIndex(key);
    if (index > -1) {
        this.array[index] = {key: key, value: value};
    } else {
        this.array.push({key: key, value: value});
    }
};
HashMap.prototype.get = function(key) {
    var index = this.getIndex(key);
    if (index > -1) {
        return this.array[index].value;
    } else {
        return undefined;
    }
};
HashMap.prototype.getAtIndex = function(index) {
    return this.array[index].value;
};
HashMap.prototype.getKeyAtIndex = function(index) {
    return this.array[index].key;
};
HashMap.prototype.remove = function(value) {
    var index = this.getIndexOfValue(value);
    this.removeByIndex(index);
};
HashMap.prototype.removeByKey = function(key) {
    var index = this.getIndex(key);
    this.removeByIndex(index);
};
HashMap.prototype.removeByIndex = function(index) {
    if(index != -1) {
        this.array.splice(index, 1);
    }
};
HashMap.prototype.clear = function() {
    this.array = new Array(0);
};
HashMap.prototype.all = function() {
    return this.array;
};
HashMap.prototype.getAllValues = function() {
	var valuesArray = [];
	for (var i=0; i<this.array.length; i++) {
        valuesArray.push(this.array[i].value);
	}
	return valuesArray;
};
HashMap.prototype.getAllKeys = function() {
	var keysArray = [];
	for (var i=0; i<this.array.length; i++) {
        keysArray.push(this.array[i].key);
	}
	return keysArray;
};
HashMap.prototype.getIndex = function(key) {
    var index = -1;
    for (var i=0; i<this.array.length; i++) {
        var item = this.array[i];
        if (item.key == key) index = i;
    }
    return index;
};
HashMap.prototype.getIndexOfValue = function(value) {
    var index = -1;
    for (var i=0; i<this.array.length; i++) {
        var item = this.array[i];
        if (item.value == value) index = i;
    }
    return index;
};
HashMap.prototype.getKeyOfValue = function(value) {
    var key = undefined;
    for (var i=0; i<this.array.length; i++) {
        var item = this.array[i];
        if (item.value == value) key = item.key;
    }
    return key;
};
HashMap.prototype.contains = function(value) {
    var index = this.getIndexOfValue(value);
    return index > -1;
};
HashMap.prototype.containsKey = function(key) {
    var index = this.getIndex(key);
    return index > -1;
};
HashMap.prototype.size = function() {
    return this.array.length;
};  
      