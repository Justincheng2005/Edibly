import "./MainHeader.css"
const MainHeader = () => {
    return (
        <header className="main-header">
            <div className="header-content">
                <a href="/" style={{ textDecoration: "none" }}>
                    <h1 className="site-title">Edibly | Campus Dining</h1>
                </a>
            </div>
        </header>
    )
}

export default MainHeader