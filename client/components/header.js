import { h, Component } from 'preact'

class Header extends Component {
  render() {
    return (
      <header class="masthead">
        <div class="intro-body">
          <div class="container">
            <div class="row">
              <div class="col-lg-8 mx-auto">
                <h1 class="brand-heading">Alaska</h1>
                <p class="intro-text">
                  A free, responsive, one page Bootstrap theme.
                  <br />
                  Created by Start Bootstrap.
                </p>
                <a href="#about" class="btn btn-circle js-scroll-trigger">
                  <i class="fa fa-angle-double-down animated"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>
    )
  }
}

export default Header