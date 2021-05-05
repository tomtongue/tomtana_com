function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var ReactDOMServer = _interopDefault(require('react-dom/server'));
var React = require('react');
var React__default = _interopDefault(React);
var react = require('@mdx-js/react');
var Slugger = _interopDefault(require('github-slugger'));
var Link = _interopDefault(require('next/link'));
var Highlight = require('prism-react-renderer');
var Highlight__default = _interopDefault(Highlight);

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

const THEME = {
  plain: {
    color: '#000',
    backgroundColor: 'transparent'
  },
  styles: [{
    types: ['keyword'],
    style: {
      color: '#ff0078',
      fontWeight: 'bold'
    }
  }, {
    types: ['comment'],
    style: {
      color: '#999',
      fontStyle: 'italic'
    }
  }, {
    types: ['string', 'url', 'attr-value'],
    style: {
      color: '#028265'
    }
  }, {
    types: ['variable', 'language-javascript'],
    style: {
      color: '#c6c5fe'
    }
  }, {
    types: ['builtin', 'char', 'constant'],
    style: {
      color: '#000'
    }
  }, {
    types: ['attr-name'],
    style: {
      color: '#d9931e',
      fontStyle: 'normal'
    }
  }, {
    types: ['punctuation', 'operator'],
    style: {
      color: '#333'
    }
  }, {
    types: ['number', 'function', 'tag'],
    style: {
      color: '#0076ff'
    }
  }, {
    types: ['boolean', 'regex'],
    style: {
      color: '#d9931e'
    }
  }]
}; // Anchor links

const SluggerContext = React.createContext();

const HeaderLink = (_ref) => {
  let {
    tag: Tag,
    children
  } = _ref,
      props = _objectWithoutPropertiesLoose(_ref, ["tag", "children"]);

  const slugger = React.useContext(SluggerContext);
  const slug = slugger.slug(ReactDOMServer.renderToStaticMarkup(children) || '');
  return /*#__PURE__*/React__default.createElement(Tag, props, /*#__PURE__*/React__default.createElement("span", {
    className: "subheading-anchor",
    id: slug
  }), /*#__PURE__*/React__default.createElement("a", {
    href: '#' + slug,
    className: "subheading"
  }, children, /*#__PURE__*/React__default.createElement("span", {
    className: "anchor-icon",
    "aria-hidden": true
  }, "#")));
};

const H2 = (_ref2) => {
  let {
    children
  } = _ref2,
      props = _objectWithoutPropertiesLoose(_ref2, ["children"]);

  return /*#__PURE__*/React__default.createElement(HeaderLink, _extends({
    tag: "h2"
  }, props), children);
};

const H3 = (_ref3) => {
  let {
    children
  } = _ref3,
      props = _objectWithoutPropertiesLoose(_ref3, ["children"]);

  return /*#__PURE__*/React__default.createElement(HeaderLink, _extends({
    tag: "h3"
  }, props), children);
};

const H4 = (_ref4) => {
  let {
    children
  } = _ref4,
      props = _objectWithoutPropertiesLoose(_ref4, ["children"]);

  return /*#__PURE__*/React__default.createElement(HeaderLink, _extends({
    tag: "h4"
  }, props), children);
};

const H5 = (_ref5) => {
  let {
    children
  } = _ref5,
      props = _objectWithoutPropertiesLoose(_ref5, ["children"]);

  return /*#__PURE__*/React__default.createElement(HeaderLink, _extends({
    tag: "h5"
  }, props), children);
};

const H6 = (_ref6) => {
  let {
    children
  } = _ref6,
      props = _objectWithoutPropertiesLoose(_ref6, ["children"]);

  return /*#__PURE__*/React__default.createElement(HeaderLink, _extends({
    tag: "h6"
  }, props), children);
};

const A = (_ref7) => {
  let {
    children
  } = _ref7,
      props = _objectWithoutPropertiesLoose(_ref7, ["children"]);

  const isExternal = props.href && props.href.startsWith('https://');

  if (isExternal) {
    return /*#__PURE__*/React__default.createElement("a", _extends({
      target: "_blank",
      rel: "noopener"
    }, props), children);
  }

  return /*#__PURE__*/React__default.createElement(Link, {
    href: props.href
  }, /*#__PURE__*/React__default.createElement("a", props, children));
};

const Code = (_ref8) => {
  let {
    children,
    className,
    highlight
  } = _ref8,
      props = _objectWithoutPropertiesLoose(_ref8, ["children", "className", "highlight"]);

  if (!className) return /*#__PURE__*/React__default.createElement("code", props, children);
  const highlightedLines = highlight ? highlight.split(',').map(Number) : []; // https://mdxjs.com/guides/syntax-highlighting#all-together

  const language = className.replace(/language-/, '');
  return /*#__PURE__*/React__default.createElement(Highlight__default, _extends({}, Highlight.defaultProps, {
    code: children.trim(),
    language: language,
    theme: THEME
  }), ({
    className,
    style,
    tokens,
    getLineProps,
    getTokenProps
  }) => /*#__PURE__*/React__default.createElement("code", {
    className: className,
    style: _extends({}, style)
  }, tokens.map((line, i) => /*#__PURE__*/React__default.createElement("div", _extends({
    key: i
  }, getLineProps({
    line,
    key: i
  }), {
    style: highlightedLines.includes(i + 1) ? {
      background: '#cce0f5',
      margin: '0 -1rem',
      padding: '0 1rem'
    } : null
  }), line.map((token, key) => /*#__PURE__*/React__default.createElement("span", _extends({
    key: key
  }, getTokenProps({
    token,
    key
  }))))))));
};

const components = {
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  a: A,
  code: Code
};
var mdxTheme = (({
  children
}) => {
  const slugger = new Slugger();
  return /*#__PURE__*/React__default.createElement(SluggerContext.Provider, {
    value: slugger
  }, /*#__PURE__*/React__default.createElement(react.MDXProvider, {
    components: components
  }, children));
});

module.exports = mdxTheme;
