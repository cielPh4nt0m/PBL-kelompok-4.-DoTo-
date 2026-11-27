package id.ac.polinema.Frontend;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;

public class Auth extends JFrame {

    private final Color BG = new Color(244, 248, 252);
    private final Color SIDEBAR = new Color(220, 237, 252);
    private final Color WHITE = Color.WHITE;
    private final Color TEXT = new Color(25, 35, 50);
    private final Color GRAY = new Color(100, 110, 125);
    private final Color BLUE = new Color(55, 125, 235);
    private final Color LIGHT_BLUE = new Color(232, 242, 253);
    private final Color RED = new Color(245, 65, 65);
    private final Color LIGHT_RED = new Color(255, 240, 240);
    private final Color GREEN = new Color(40, 180, 120);

    public Auth() {
        setTitle("Security & Privacy");
        setSize(1200, 800);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        JPanel root = new JPanel(new BorderLayout());
        root.setBackground(BG);

        // =========================
        // SIDEBAR
        // =========================
        root.add(createSidebar(), BorderLayout.WEST);

        // =========================
        // MAIN CONTENT
        // =========================
        root.add(createMainContent(), BorderLayout.CENTER);

        setContentPane(root);
    }

    // =========================================================
    // SIDEBAR
    // =========================================================
    private JPanel createSidebar() {

        JPanel sidebar = new JPanel();
        sidebar.setPreferredSize(new Dimension(245, 0));
        sidebar.setBackground(SIDEBAR);
        sidebar.setLayout(new BorderLayout());
        sidebar.setBorder(new EmptyBorder(20, 18, 20, 18));

        JPanel top = new JPanel();
        top.setOpaque(false);
        top.setLayout(new BoxLayout(top, BoxLayout.Y_AXIS));

        // Logo
        JLabel logo = new JLabel("Doto +");
        logo.setFont(new Font("SansSerif", Font.PLAIN, 27));
        logo.setForeground(TEXT);
        logo.setAlignmentX(Component.LEFT_ALIGNMENT);

        JLabel subtitle = new JLabel("Doto : Manajemen Tugas Tim & Agen AI");
        subtitle.setFont(new Font("SansSerif", Font.PLAIN, 9));
        subtitle.setForeground(TEXT);
        subtitle.setAlignmentX(Component.LEFT_ALIGNMENT);

        top.add(logo);
        top.add(Box.createVerticalStrut(4));
        top.add(subtitle);

        top.add(Box.createVerticalStrut(18));

        // Profile
        JPanel profile = new JPanel(new BorderLayout(10, 0));
        profile.setBackground(new Color(231, 243, 253));
        profile.setBorder(new EmptyBorder(8, 8, 8, 8));
        profile.setMaximumSize(new Dimension(Integer.MAX_VALUE, 55));

        JLabel avatar = new JLabel("OC", SwingConstants.CENTER);
        avatar.setOpaque(true);
        avatar.setBackground(new Color(92, 205, 240));
        avatar.setForeground(Color.WHITE);
        avatar.setFont(new Font("SansSerif", Font.BOLD, 12));
        avatar.setPreferredSize(new Dimension(35, 35));

        JPanel userInfo = new JPanel();
        userInfo.setOpaque(false);
        userInfo.setLayout(new BoxLayout(userInfo, BoxLayout.Y_AXIS));

        JLabel username = new JLabel("OciPiyik12345");
        username.setFont(new Font("SansSerif", Font.BOLD, 12));

        JLabel email = new JLabel("Ocipiyik@gmail.com");
        email.setFont(new Font("SansSerif", Font.PLAIN, 8));
        email.setForeground(GRAY);

        userInfo.add(username);
        userInfo.add(email);

        JLabel arrow = new JLabel("⌄");
        arrow.setFont(new Font("SansSerif", Font.BOLD, 18));

        profile.add(avatar, BorderLayout.WEST);
        profile.add(userInfo, BorderLayout.CENTER);
        profile.add(arrow, BorderLayout.EAST);

        top.add(profile);
        top.add(Box.createVerticalStrut(20));

        // Menu
        addMenu(top, "▦", "Dashboard Proyek");
        addMenu(top, "☷", "Daftar Tugas");
        addMenu(top, "♟", "Anggota Tim");
        addMenu(top, "♙", "Agen AI");

        top.add(Box.createVerticalStrut(18));

        JLabel projects = new JLabel("Projects");
        projects.setFont(new Font("SansSerif", Font.PLAIN, 27));
        projects.setAlignmentX(Component.LEFT_ALIGNMENT);

        top.add(projects);
        top.add(Box.createVerticalStrut(8));

        addProject(top, "Kelompok 4 PBL", true);
        addProject(top, "Agenda Lomba UI/UX", false);
        addProject(top, "Polinema Mengajar", false);
        addProject(top, "Draft Proyek", false);

        sidebar.add(top, BorderLayout.NORTH);

        // Bottom menu
        JPanel bottom = new JPanel();
        bottom.setOpaque(false);
        bottom.setLayout(new BoxLayout(bottom, BoxLayout.Y_AXIS));

        addMenu(bottom, "⚙", "Setting");
        addMenu(bottom, "‹", "Collapse");

        sidebar.add(bottom, BorderLayout.SOUTH);

        return sidebar;
    }

    private void addMenu(JPanel parent, String icon, String text) {

        JPanel menu = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 7));
        menu.setOpaque(false);
        menu.setMaximumSize(new Dimension(Integer.MAX_VALUE, 40));

        JLabel iconLabel = new JLabel(icon);
        iconLabel.setFont(new Font("SansSerif", Font.PLAIN, 21));

        JLabel textLabel = new JLabel(text);
        textLabel.setFont(new Font("SansSerif", Font.PLAIN, 14));

        menu.add(iconLabel);
        menu.add(textLabel);

        parent.add(menu);
    }

    private void addProject(JPanel parent, String text, boolean plus) {

        JPanel project = new JPanel(new BorderLayout());
        project.setOpaque(false);
        project.setMaximumSize(new Dimension(Integer.MAX_VALUE, 30));

        JLabel name = new JLabel("›  " + text);
        name.setFont(new Font("SansSerif", Font.PLAIN, 14));

        project.add(name, BorderLayout.WEST);

        if (plus) {
            JLabel add = new JLabel("+");
            add.setFont(new Font("SansSerif", Font.BOLD, 16));
            project.add(add, BorderLayout.EAST);
        }

        parent.add(project);
    }

    // =========================================================
    // MAIN
    // =========================================================
    private JPanel createMainContent() {

        JPanel main = new JPanel(new BorderLayout());
        main.setBackground(WHITE);
        main.setBorder(new EmptyBorder(35, 28, 30, 28));

        // Header
        JPanel header = new JPanel();
        header.setOpaque(false);
        header.setLayout(new BoxLayout(header, BoxLayout.Y_AXIS));

        JLabel title = new JLabel("Security & Privacy");
        title.setFont(new Font("SansSerif", Font.BOLD, 28));
        title.setForeground(TEXT);

        JLabel desc = new JLabel(
                "Kelola keamanan akun, sesi login, dan privasi data Anda."
        );
        desc.setFont(new Font("SansSerif", Font.PLAIN, 13));

        header.add(title);
        header.add(Box.createVerticalStrut(2));
        header.add(desc);

        JSeparator separator = new JSeparator();
        separator.setForeground(new Color(220, 225, 230));

        header.add(Box.createVerticalStrut(12));
        header.add(separator);

        main.add(header, BorderLayout.NORTH);

        // Content 2 kolom
        JPanel content = new JPanel(new GridLayout(1, 2, 18, 0));
        content.setOpaque(false);
        content.setBorder(new EmptyBorder(10, 0, 0, 0));

        // LEFT
        JPanel left = new JPanel();
        left.setOpaque(false);
        left.setLayout(new BoxLayout(left, BoxLayout.Y_AXIS));

        left.add(createAuthenticationCard());
        left.add(Box.createVerticalStrut(16));
        left.add(createSessionsCard());

        // RIGHT
        JPanel right = new JPanel();
        right.setOpaque(false);
        right.setLayout(new BoxLayout(right, BoxLayout.Y_AXIS));

        right.add(createPrivacyCard());
        right.add(Box.createVerticalStrut(16));
        right.add(createDangerCard());

        content.add(left);
        content.add(right);

        main.add(content, BorderLayout.CENTER);

        return main;
    }

    // =========================================================
    // CARD 1 - AUTHENTICATION
    // =========================================================
    private JPanel createAuthenticationCard() {

        JPanel card = createCard();

        JPanel header = createCardHeader(
                "♧",
                "1. Password & Authentication",
                "Jaga keamanan akun Anda tetap terlindungi."
        );

        card.add(header);
        card.add(createLine(
                "◉  Change Password",
                "Perbarui kata sandi akun Anda.",
                null
        ));

        card.add(createLine(
                "ⓘ  Forgot Password",
                "Reset kata sandi jika Anda lupa.",
                createButton("Reset", BLUE)
        ));

        // 2FA
        JPanel twoFA = new JPanel(new BorderLayout());
        twoFA.setBackground(WHITE);
        twoFA.setBorder(new EmptyBorder(9, 10, 9, 10));

        JPanel twoText = new JPanel();
        twoText.setOpaque(false);
        twoText.setLayout(new BoxLayout(twoText, BoxLayout.Y_AXIS));

        JLabel t1 = new JLabel("◉  Two-Factor Authentication (2FA)");
        t1.setFont(new Font("SansSerif", Font.BOLD, 11));

        JLabel t2 = new JLabel("Tambahkan lapisan keamanan ekstra pada akun Anda.");
        t2.setFont(new Font("SansSerif", Font.PLAIN, 9));

        twoText.add(t1);
        twoText.add(Box.createVerticalStrut(3));
        twoText.add(t2);

        JCheckBox toggle = new JCheckBox();
        toggle.setOpaque(false);
        toggle.setPreferredSize(new Dimension(45, 25));

        twoFA.add(twoText, BorderLayout.CENTER);
        twoFA.add(toggle, BorderLayout.EAST);

        card.add(twoFA);
        card.add(createLine(
                "✉  Email Verification",
                "Verifikasi alamat email untuk keamanan tambahan.",
                createButton("Verifikasi", BLUE)
        ));

        return card;
    }

    // =========================================================
    // CARD 2 - SESSIONS
    // =========================================================
    private JPanel createSessionsCard() {

        JPanel card = createCard();

        card.add(createCardHeader(
                "▣",
                "2. Login & Sessions",
                "Contoh tampilan sesi; bukan data login akun."
        ));

        JPanel deviceTitle = new JPanel(new BorderLayout());
        deviceTitle.setBackground(WHITE);
        deviceTitle.setBorder(new EmptyBorder(9, 10, 5, 10));

        JLabel title = new JLabel("▣  Perangkat yang Sedang Login");
        title.setFont(new Font("SansSerif", Font.BOLD, 10));

        deviceTitle.add(title, BorderLayout.WEST);
        card.add(deviceTitle);

        card.add(createDevice(
                "▱  Perangkat desktop (contoh)",
                "◉ Login terakhir: —    ⌖ Lokasi: jika tersedia dan relevan",
                "Contoh sesi",
                GREEN
        ));

        card.add(createDevice(
                "▯  Perangkat seluler (contoh)",
                "◉ Login terakhir: —    ⌖ Lokasi tidak tersedia",
                "Logout",
                RED
        ));

        JPanel logout = new JPanel(new BorderLayout());
        logout.setBackground(WHITE);
        logout.setBorder(new EmptyBorder(8, 10, 8, 10));

        JLabel logoutText = new JLabel("⇥  Logout dari Semua Perangkat");
        logoutText.setFont(new Font("SansSerif", Font.BOLD, 10));
        logoutText.setForeground(RED);

        JLabel arrow = new JLabel("›");
        arrow.setForeground(RED);
        arrow.setFont(new Font("SansSerif", Font.BOLD, 18));

        logout.add(logoutText, BorderLayout.WEST);
        logout.add(arrow, BorderLayout.EAST);

        card.add(logout);

        return card;
    }

    // =========================================================
    // CARD 3 - PRIVACY
    // =========================================================
    private JPanel createPrivacyCard() {

        JPanel card = createCard();

        card.add(createCardHeader(
                "◉",
                "3. Privacy & Data",
                "Kendalikan visibilitas profil dan penggunaan data Anda."
        ));

        // Profile Visibility
        JPanel visibility = new JPanel(new BorderLayout(10, 0));
        visibility.setBackground(WHITE);
        visibility.setBorder(new EmptyBorder(9, 10, 9, 10));

        JLabel label = new JLabel("◉  Profile Visibility");
        label.setFont(new Font("SansSerif", Font.BOLD, 10));

        JPanel choices = new JPanel(new GridLayout(1, 3));
        choices.setBackground(new Color(242, 244, 247));

        JButton all = createButton("Tim saja", BLUE);
        JButton publik = createSmallButton("Publik");
        JButton privat = createSmallButton("Privat");

        choices.add(all);
        choices.add(publik);
        choices.add(privat);

        visibility.add(label, BorderLayout.WEST);
        visibility.add(choices, BorderLayout.EAST);

        card.add(visibility);

        card.add(createLine(
                "⚙  Pengaturan Penggunaan Data oleh AI",
                "Kelola bagaimana data proyek Anda digunakan Agen AI.",
                null
        ));

        card.add(createLine(
                "▤  Informasi Pengelolaan Data",
                "Pelajari cara data disimpan dan dikelola.",
                null
        ));

        card.add(createLine(
                "⇩  Download Data Akun (opsional)",
                "Unduh salinan data akun Anda dalam format arsip.",
                null
        ));

        JPanel info = new JPanel(new BorderLayout());
        info.setBackground(new Color(255, 248, 220));
        info.setBorder(new EmptyBorder(8, 10, 8, 10));

        JLabel infoText = new JLabel(
                "ⓘ Ketersediaan dan cara unduh mengikuti kebijakan tim."
        );
        infoText.setFont(new Font("SansSerif", Font.PLAIN, 9));
        infoText.setForeground(new Color(170, 100, 10));

        info.add(infoText, BorderLayout.WEST);

        card.add(info);

        return card;
    }

    // =========================================================
    // DANGER ZONE
    // =========================================================
    private JPanel createDangerCard() {

        JPanel card = createCard();
        card.setBorder(BorderFactory.createLineBorder(
                new Color(255, 120, 120), 1
        ));

        JPanel header = new JPanel(new BorderLayout(10, 0));
        header.setBackground(LIGHT_RED);
        header.setBorder(new EmptyBorder(10, 10, 10, 10));

        JLabel icon = new JLabel("⚠");
        icon.setFont(new Font("SansSerif", Font.BOLD, 18));
        icon.setForeground(RED);

        JPanel text = new JPanel();
        text.setOpaque(false);
        text.setLayout(new BoxLayout(text, BoxLayout.Y_AXIS));

        JLabel danger = new JLabel("Danger Zone");
        danger.setFont(new Font("SansSerif", Font.BOLD, 13));
        danger.setForeground(RED);

        JLabel warning = new JLabel(
                "Tindakan ini bersifat permanen dan tidak dapat dibatalkan."
        );
        warning.setFont(new Font("SansSerif", Font.PLAIN, 9));
        warning.setForeground(RED);

        text.add(danger);
        text.add(warning);

        header.add(icon, BorderLayout.WEST);
        header.add(text, BorderLayout.CENTER);

        card.add(header);

        JPanel delete = new JPanel();
        delete.setBackground(WHITE);
        delete.setLayout(new BoxLayout(delete, BoxLayout.Y_AXIS));
        delete.setBorder(new EmptyBorder(12, 10, 12, 10));

        JLabel deleteTitle = new JLabel("▣  Delete Account");
        deleteTitle.setFont(new Font("SansSerif", Font.BOLD, 10));
        deleteTitle.setForeground(RED);

        JLabel deleteDesc = new JLabel(
                "<html>Penghapusan akun memerlukan konfirmasi eksplisit. Data yang dihapus atau tetap disimpan<br>" +
                "mengikuti kebijakan proyek, tim, dan retensi data.</html>"
        );
        deleteDesc.setFont(new Font("SansSerif", Font.PLAIN, 9));

        JButton deleteButton = createButton("▣  Hapus Akun Saya", RED);
        deleteButton.setAlignmentX(Component.LEFT_ALIGNMENT);

        delete.add(deleteTitle);
        delete.add(Box.createVerticalStrut(4));
        delete.add(deleteDesc);
        delete.add(Box.createVerticalStrut(10));
        delete.add(deleteButton);

        card.add(delete);

        return card;
    }

    // =========================================================
    // COMPONENT HELPERS
    // =========================================================

    private JPanel createCard() {

        JPanel panel = new JPanel();
        panel.setBackground(WHITE);
        panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
        panel.setBorder(BorderFactory.createLineBorder(
                new Color(225, 230, 235), 1
        ));

        return panel;
    }

    private JPanel createCardHeader(
            String icon,
            String title,
            String subtitle
    ) {

        JPanel header = new JPanel(new BorderLayout(10, 0));
        header.setBackground(new Color(248, 250, 252));
        header.setBorder(new EmptyBorder(10, 10, 10, 10));

        JLabel iconLabel = new JLabel(icon);
        iconLabel.setFont(new Font("SansSerif", Font.BOLD, 17));

        JPanel text = new JPanel();
        text.setOpaque(false);
        text.setLayout(new BoxLayout(text, BoxLayout.Y_AXIS));

        JLabel titleLabel = new JLabel(title);
        titleLabel.setFont(new Font("SansSerif", Font.BOLD, 12));
        titleLabel.setForeground(TEXT);

        JLabel subtitleLabel = new JLabel(subtitle);
        subtitleLabel.setFont(new Font("SansSerif", Font.PLAIN, 9));
        subtitleLabel.setForeground(GRAY);

        text.add(titleLabel);
        text.add(Box.createVerticalStrut(2));
        text.add(subtitleLabel);

        header.add(iconLabel, BorderLayout.WEST);
        header.add(text, BorderLayout.CENTER);

        return header;
    }

    private JPanel createLine(
            String title,
            String subtitle,
            JButton button
    ) {

        JPanel line = new JPanel(new BorderLayout(10, 0));
        line.setBackground(WHITE);
        line.setBorder(new EmptyBorder(8, 10, 8, 10));

        JPanel text = new JPanel();
        text.setOpaque(false);
        text.setLayout(new BoxLayout(text, BoxLayout.Y_AXIS));

        JLabel titleLabel = new JLabel(title);
        titleLabel.setFont(new Font("SansSerif", Font.BOLD, 10));

        JLabel subtitleLabel = new JLabel(subtitle);
        subtitleLabel.setFont(new Font("SansSerif", Font.PLAIN, 9));
        subtitleLabel.setForeground(GRAY);

        text.add(titleLabel);
        text.add(Box.createVerticalStrut(3));
        text.add(subtitleLabel);

        line.add(text, BorderLayout.CENTER);

        if (button != null) {
            line.add(button, BorderLayout.EAST);
        } else {
            JLabel arrow = new JLabel("›");
            arrow.setFont(new Font("SansSerif", Font.BOLD, 17));
            arrow.setForeground(GRAY);
            line.add(arrow, BorderLayout.EAST);
        }

        return line;
    }

    private JPanel createDevice(
            String title,
            String subtitle,
            String status,
            Color statusColor
    ) {

        JPanel device = new JPanel(new BorderLayout());
        device.setBackground(new Color(248, 250, 252));
        device.setBorder(BorderFactory.createLineBorder(
                new Color(225, 230, 235)
        ));
        device.setBorder(new EmptyBorder(7, 8, 7, 8));

        JPanel info = new JPanel();
        info.setOpaque(false);
        info.setLayout(new BoxLayout(info, BoxLayout.Y_AXIS));

        JLabel titleLabel = new JLabel(title);
        titleLabel.setFont(new Font("SansSerif", Font.BOLD, 9));

        JLabel subtitleLabel = new JLabel(subtitle);
        subtitleLabel.setFont(new Font("SansSerif", Font.PLAIN, 8));
        subtitleLabel.setForeground(GRAY);

        info.add(titleLabel);
        info.add(Box.createVerticalStrut(3));
        info.add(subtitleLabel);

        JButton statusButton = createSmallButton(status);
        statusButton.setForeground(statusColor);

        device.add(info, BorderLayout.CENTER);
        device.add(statusButton, BorderLayout.EAST);

        return device;
    }

    private JButton createButton(String text, Color color) {

        JButton button = new JButton(text);
        button.setFont(new Font("SansSerif", Font.BOLD, 9));
        button.setForeground(Color.WHITE);
        button.setBackground(color);
        button.setFocusPainted(false);
        button.setBorderPainted(false);
        button.setOpaque(true);
        button.setCursor(new Cursor(Cursor.HAND_CURSOR));

        return button;
    }

    private JButton createSmallButton(String text) {

        JButton button = new JButton(text);
        button.setFont(new Font("SansSerif", Font.PLAIN, 9));
        button.setFocusPainted(false);
        button.setBorderPainted(false);
        button.setBackground(new Color(242, 244, 247));
        button.setCursor(new Cursor(Cursor.HAND_CURSOR));

        return button;
    }

    // =========================================================
    // MAIN
    // =========================================================
    public static void main(String[] args) {

        SwingUtilities.invokeLater(() -> {
            Auth login = new Auth();
            login.setVisible(true);
        });
    }
}