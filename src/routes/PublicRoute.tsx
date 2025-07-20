import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuth } from '../hooks';

interface PublicRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

const PublicRoute: React.FC<PublicRouteProps> = ({
  component: Component,
  ...rest
}) => {
  const { isAuthenticated } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) =>
        !isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect to={{ pathname: '/tabs/home' }} />
        )
      }
    />
  );
};

export default PublicRoute;