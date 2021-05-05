function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var ReactDOMServer = _interopDefault(require('react-dom/server'));
var Head = _interopDefault(require('next/head'));
var Link = _interopDefault(require('next/link'));
var router = require('next/router');
var react = require('@mdx-js/react');
var Slugger = _interopDefault(require('github-slugger'));
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

function Meta({
  author,
  date,
  tag,
  back
}) {
  const authorNode = author ? author : null;
  const dateNode = date ? /*#__PURE__*/React__default.createElement("time", null, new Date(date).toDateString()) : null;
  const tags = tag ? tag.split(',').map(s => s.trim()) : [];
  return /*#__PURE__*/React__default.createElement("div", {
    className: "meta-line"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "meta"
  }, authorNode, authorNode && dateNode ? ', ' : null, dateNode, (authorNode || dateNode) && tags.length ? ' • ' : null, tags.map(t => {
    return /*#__PURE__*/React__default.createElement(Link, {
      key: t,
      href: "/tags/[tag]",
      as: `/tags/${t}`
    }, /*#__PURE__*/React__default.createElement("a", {
      className: "tag"
    }, t));
  })), back ? /*#__PURE__*/React__default.createElement(Link, {
    href: back
  }, /*#__PURE__*/React__default.createElement("a", {
    className: "meta-back"
  }, "Back")) : null);
}


function Nav({navPages}) {
  const iconStyle={height: '30px', marginTop: '0', marginBottom: '0', marginLeft: '0.5rem', marginRight: '0.5rem'}
  return <div className="nav-line">
    <td className="nav-link">
      <a href="https://github.com/tomtongue" className="nav-link">
        <img src="/icons/GitHub-Mark-120px-plus.png" alt="" style={iconStyle}></img>
      </a>
    </td>
    <td className="nav-link">
      <a href="https://www.linkedin.com/in/tomohiro-tanaka-bb186039/" className="nav-link">
        <img src="/icons/LI-In-Bug.png" alt="" style={iconStyle}></img>
      </a>
    </td>
  </div>
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
var MDXTheme = (({
  children
}) => {
  const slugger = new Slugger();
  return /*#__PURE__*/React__default.createElement(SluggerContext.Provider, {
    value: slugger
  }, /*#__PURE__*/React__default.createElement(react.MDXProvider, {
    components: components
  }, children));
});

// BFS traverse the page map tree
function traverse(pageMap, matcher) {
  for (let i = 0; i < pageMap.length; i++) {
    if (matcher(pageMap[i])) {
      return pageMap[i];
    }
  }

  for (let i = 0; i < pageMap.length; i++) {
    if (pageMap[i].children) {
      const matched = traverse(pageMap[i].children, matcher);

      if (matched) {
        return matched;
      }
    }
  }

  return null;
}

function getTitle(children) {
  const nodes = React__default.Children.toArray(children);
  const titleEl = nodes.find(child => child.props.mdxType === 'h1');
  return [titleEl || null, nodes.filter(node => node !== titleEl)];
}

function getTags(page) {
  if (!page.frontMatter) {
    return [];
  }

  const tags = page.frontMatter.tag || '';
  return tags.split(',').map(s => s.trim());
}

var sortDate = ((a, b) => {
  if (!a.frontMatter || !a.frontMatter.date) return -1;
  if (!b.frontMatter || !b.frontMatter.date) return -1;
  return new Date(a.frontMatter.date) > new Date(b.frontMatter.date) ? -1 : 1;
});

const Layout = ({
  config,
  meta,
  navPages,
  postList,
  back,
  title,
  children
}) => {
  const [titleNode, contentNodes] = getTitle(children);
  const type = meta.type || 'post';
  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement(Head, null, /*#__PURE__*/React__default.createElement("title", null, title), config.head || null), /*#__PURE__*/React__default.createElement("article", {
    className: "container prose prose-sm md:prose"
  }, titleNode, type === 'post' ? /*#__PURE__*/React__default.createElement(Meta, _extends({}, meta, {
    back: back,
    config: config
  })) : /*#__PURE__*/React__default.createElement(Nav, {
    navPages: navPages
  }), /*#__PURE__*/React__default.createElement(MDXTheme, null, contentNodes, type === 'post' ? config.postFooter : null), postList, config.footer));
};

var index = ((opts, _config) => {
  const config = Object.assign({
    readMore: null, // Removed read more button
    footer: /*#__PURE__*/React__default.createElement("small", {
      style: {
        display: 'block',
        marginTop: '8rem'
      }
    }, "CC BY-NC 4.0 2020 \xA9 Shu Ding."),
    postFooter: null
  }, _config); // gather info for tag/posts pages

  let posts = null;
  let navPages = [];
  const type = opts.meta.type || 'post';
  const route = opts.route; // This only renders once per page

  if (type === 'posts' || type === 'tag' || type === 'page') {
    posts = []; // let's get all posts

    traverse(opts.pageMap, page => {
      if (page.frontMatter && ['page', 'posts'].includes(page.frontMatter.type)) {
        if (page.route === route) {
          navPages.push(_extends({}, page, {
            active: true
          }));
        } else {
          navPages.push(page);
        }
      }

      if (page.children) return;
      if (page.name.startsWith('_')) return;
      if (type === 'posts' && !page.route.startsWith(route === '/' ? route : route + '/')) return;

      if (type !== 'page' && (!page.frontMatter || !page.frontMatter.type || page.frontMatter.type === 'post')) {
        posts.push(page);
      }
    });
    posts = posts.sort(sortDate);
    navPages = navPages.sort(sortDate);
  } // back button


  let back = null;

  if (type !== 'post') {
    back = null;
  } else {
    const parentPages = [];
    traverse(opts.pageMap, page => {
      if (route !== page.route && (route + '/').startsWith(page.route === '/' ? '/' : page.route + '/')) {
        parentPages.push(page);
      }
    });
    const parentPage = parentPages.reverse().find(page => page.frontMatter && page.frontMatter.type === 'posts');

    if (parentPage) {
      back = parentPage.route;
    }
  }

  return props => {
    const router$1 = router.useRouter();
    const {
      query
    } = router$1;
    const type = opts.meta.type || 'post';
    const tagName = type === 'tag' ? query.tag : null;
    const [titleNode] = getTitle(props.children);
    const title = opts.meta.title || (typeof tagName === 'undefined' ? null : titleNode ? ReactDOMServer.renderToStaticMarkup(titleNode.props.children) : null) || '';
    const postList = posts ? /*#__PURE__*/React__default.createElement("ul", null, posts.map(post => {
      if (tagName) {
        const tags = getTags(post);

        if (!tags.includes(tagName)) {
          return null;
        }
      } else if (type === 'tag') {
        return null;
      }

      const postTitle = (post.frontMatter ? post.frontMatter.title : null) || post.name;
      const postDate = post.frontMatter ? /*#__PURE__*/React__default.createElement("time", {
        className: "post-item-date"
      }, new Date(post.frontMatter.date).toDateString()) : null;
      const postDescription = post.frontMatter && post.frontMatter.description ? /*#__PURE__*/React__default.createElement("p", {
        className: "post-item-desc"
      }, post.frontMatter.description, config.readMore ? /*#__PURE__*/React__default.createElement(Link, {
        href: post.route
      }, /*#__PURE__*/React__default.createElement("a", {
        className: "post-item-more"
      }, config.readMore)) : null) : null;
      return /*#__PURE__*/React__default.createElement("div", {
        key: post.route,
        className: "post-item"
      }, /*#__PURE__*/React__default.createElement("h2", null, /*#__PURE__*/React__default.createElement(Link, {
        href: post.route,
      }, /*#__PURE__*/React__default.createElement("a", {
        className: "post-item-title",
        style: {color: '#0677ED'}
      }, postTitle))), postDescription, postDate);
    })) : null;
    return /*#__PURE__*/React__default.createElement(Layout, _extends({
      config: config,
      postList: postList,
      navPages: navPages,
      back: back,
      title: title
    }, opts, props));
  };
});

module.exports = index;
