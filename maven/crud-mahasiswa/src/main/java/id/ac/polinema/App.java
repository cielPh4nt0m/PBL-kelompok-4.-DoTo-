package id.ac.polinema;

import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JTextField;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.table.DefaultTableModel;

/**
 * Hello world!
 */
public class App {
    public static void main(String[] args) {
        System.out.println("Hello World!");

        JFrame frame = new JFrame();
        frame.setSize(600, 300);
        frame.setTitle("aplikasi Database Java");
        frame.setLocationRelativeTo(null);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

        frame.setLayout(null);

        JButton btnCreate = new JButton("Create");
        JButton btnUpdate = new JButton("Update");
        JButton btnDelete = new JButton("Delete");

        btnUpdate.setEnabled(false);
        btnDelete.setEnabled(false);

        btnCreate.setBounds(30, 120, 100, 30);
        btnUpdate.setBounds(140, 120, 100, 30);
        btnDelete.setBounds(250, 120, 100, 30);

        frame.add(btnCreate);
        frame.add(btnUpdate);
        frame.add(btnDelete);

        JLabel lblNIM = new JLabel("NIM");
        lblNIM.setBounds(30, 30, 100, 25);
        frame.add(lblNIM);

        JLabel lblNama = new JLabel("Nama");
        lblNama.setBounds(30, 65, 100, 25);
        frame.add(lblNama);

        JTextField txtNIM = new JTextField();
        txtNIM.setBounds(140, 30, 210, 25);
        frame.add(txtNIM);

        JTextField txtNama = new JTextField();
        txtNama.setBounds(140, 65, 210, 25);
        frame.add(txtNama);

        String[] kolom = {"NIM", "Nama"};

        DefaultTableModel model = new DefaultTableModel(kolom, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };

        JTable tabel = new JTable(model);

        JScrollPane scrollPane = new JScrollPane(tabel);
        scrollPane.setBounds(30, 170, 210, 75);
        frame.add(scrollPane);

        JButton btnEdit = new JButton("Edit");
        btnEdit.setBounds(250, 170, 100, 30);
        frame.add(btnEdit);

        btnEdit.addActionListener(e -> {
            String nim = txtNIM.getText().trim();
            String nama = txtNama.getText().trim();

            if (nim.isEmpty() || nama.isEmpty()) {
                JOptionPane.showMessageDialog(
                    frame,
                    "NIM dan Nama harus diisi!"
                );
                return;
            }

            try {
                Integer.parseInt(nim);
            } catch (NumberFormatException ex) {
                JOptionPane.showMessageDialog(
                    frame,
                    "NIM harus berupa angka!"
                );
                return;
            }

            model.addRow(new Object[]{nim, nama});
        });
        
        frame.setVisible(true);
        
        int row = tabel.getSelectedRow();

        String nim = model.getValueAt(row, 0).toString();
        String nama = model.getValueAt(row, 1).toString();

        JOptionPane.showMessageDialog(
        frame,
        "NIM : " + nim + "\nNama : " + nama,
        "Detail Data",
        JOptionPane.INFORMATION_MESSAGE
        );

        frame.setVisible(true);
    }
}