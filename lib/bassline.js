require('./string-helpers');
require('./dust-mod');
require('./jquery-ext');

var Bassline = {
	Model: require('./model'),
	View: require('./view'),
	FormView: require('./form-view'),
	ModelView: require('./model-view'),
	CollectionView: require('./collection-view')
};

module.exports = Bassline;
