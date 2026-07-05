CREATE OR REPLACE FUNCTION keep_alive()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object('ok', true, 'timestamp', now()::text);
END;
$$;

GRANT EXECUTE ON FUNCTION keep_alive() TO anon;
GRANT EXECUTE ON FUNCTION keep_alive() TO public;
