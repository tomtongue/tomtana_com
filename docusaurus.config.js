/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'tomtana.com',
  tagline: 'Exploring unknown!',
  url: 'https://tomtana.com',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'tomtongue', // Usually your GitHub org/user name.
  projectName: 'tomtana_com', // Usually your repo name.
  themeConfig: {
    hideableSidebar: true,
    prism: {      
      theme: require('prism-react-renderer/themes/github'),
      darkTheme: require('prism-react-renderer/themes/dracula'),
      additionalLanguages: ['java', 'scala', 'swift', 'rust', 'python']
    },
    navbar: {
      hideOnScroll: true,
      title: 'Coffeeholic!',
      logo: {
        alt: 'be coffeeholic',
        src: 'img/tomtana_com_icon.png',
      },
      items:[
        {to: 'about-me', label: '👦🏻About me', position: 'left'},
        {
          href: 'https://books.tomtana.com',
          position: 'right',
          className: 'header-booktan-link',
          'aria-label': 'books_tomtana_com'
        },
        {
          href: 'https://www.linkedin.com/in/tomohiro-tanaka-bb186039/',
          position: 'right',
          className: 'header-linkedin-link',
          'aria-label': 'LinkedIn',
        },
        {
          href: 'https://github.com/tomtongue',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ]
    },
    colorMode: {
      respectPrefersColorScheme: true,
      switchConfig: {
        darkIcon: '●',
        lightIcon: '○'
      }
    },
    footer: {
      style: 'light',
      copyright: `Copyright © ${new Date().getFullYear()} tomtan. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: false,
        blog: {
          path: './blog',
          routeBasePath: '/',
          showReadingTime: true,
          blogTitle: 'Docusaurus blog!',
          blogDescription: 'A Docusaurus powered blog!',
          postsPerPage: 20,
          blogSidebarCount: 20,
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
