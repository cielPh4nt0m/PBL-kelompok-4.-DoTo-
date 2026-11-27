package id.ac.polinema.Backend;

import java.sql.*;

public class DBHelper {
    // Ganti db_mahasiswa & password sesuai settingan PostgreSQL kamu
    private static final String URL = "jdbc:postgresql://localhost:5432/db_mahasiswa";
    private static final String USER = "postgres";
    private static final String PASS = "postgres";

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASS);
    }

    private static void isiParameter(PreparedStatement ps, Object... params) throws SQLException {
        for (int i = 0; i < params.length; i++) {
            ps.setObject(i + 1, params[i]);
        }
    }

    public static int insertQueryGetId(String sql, Object... params) {
        try (var c = getConnection();
             var ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            isiParameter(ps, params);
            ps.executeUpdate();
            try (var rs = ps.getGeneratedKeys()) {
                return rs.next() ? rs.getInt(1) : -1;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    public static boolean executeQuery(String sql, Object... params) {
        try (var c = getConnection();
             var ps = c.prepareStatement(sql)) {
            isiParameter(ps, params);
            ps.executeUpdate();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}