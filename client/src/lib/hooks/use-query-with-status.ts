import { makeUseQueryWithStatus } from "convex-helpers/react";
import { useQueries } from "convex/react";

/*
  An enhanced version of the useQuery hook that provides additional status tracking.
  
  Returns an object with the following properties:
  - `status`: "success" | "pending" | "error"
  - `data`: The query result (if successful)
  - `error`: Error object (if query failed)
  - `isSuccess`: true if query loaded successfully
  - `isPending`: true if query is still loading
  - `isError`: true if query threw an exception

  Example usage:
  ```typescript
  const { data, status, error, isLoading, isSuccess, isError } = useQueryWithStatus(
    api.users.list, 
    { limit: 10 }
  );

  ```
 */
export const useQueryWithStatus = makeUseQueryWithStatus(useQueries);
