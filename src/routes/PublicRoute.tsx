import { Route, Redirect, RouteProps } from 'react-router-dom';

// Type workaround for React 18 + react-router v5 compatibility
const RouteCompat = Route as any;
const RedirectCompat = Redirect as any;
import { useAuth } from '../hooks';

interface PublicRouteProps extends Omit<RouteProps, 'component'> {
  component: React.ComponentType<any>;
}

const PublicRoute: React.FC<PublicRouteProps> = ({
  component: Component,
  ...rest
}) => {
  const { isAuthenticated } = useAuth();

  return (
    <RouteCompat
      {...rest}
      render={(props: any) =>
        !isAuthenticated ? (
          <Component {...props} />
        ) : (
          <RedirectCompat to={{ pathname: '/tabs/home' }} />
        )
      }
    />
  );
};

export default PublicRoute;