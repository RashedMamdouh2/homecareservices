using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Homecare.Migrations
{
    /// <inheritdoc />
    public partial class modifyDiseasetable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Disease_Patients_PatientId",
                table: "Disease");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Disease",
                table: "Disease");

            migrationBuilder.DropIndex(
                name: "IX_Disease_PatientId",
                table: "Disease");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "Disease");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Disease");

            migrationBuilder.DropColumn(
                name: "PatientId",
                table: "Disease");

            migrationBuilder.AlterColumn<string>(
                name: "ICD",
                table: "Disease",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Disease",
                table: "Disease",
                column: "ICD");

            migrationBuilder.CreateTable(
                name: "DiseasePatient",
                columns: table => new
                {
                    DiseasesICD = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    patientsId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiseasePatient", x => new { x.DiseasesICD, x.patientsId });
                    table.ForeignKey(
                        name: "FK_DiseasePatient_Disease_DiseasesICD",
                        column: x => x.DiseasesICD,
                        principalTable: "Disease",
                        principalColumn: "ICD",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DiseasePatient_Patients_patientsId",
                        column: x => x.patientsId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DiseasePatient_patientsId",
                table: "DiseasePatient",
                column: "patientsId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DiseasePatient");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Disease",
                table: "Disease");

            migrationBuilder.AlterColumn<string>(
                name: "ICD",
                table: "Disease",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AddColumn<int>(
                name: "Id",
                table: "Disease",
                type: "int",
                nullable: false,
                defaultValue: 0)
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Disease",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "PatientId",
                table: "Disease",
                type: "int",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Disease",
                table: "Disease",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_Disease_PatientId",
                table: "Disease",
                column: "PatientId");

            migrationBuilder.AddForeignKey(
                name: "FK_Disease_Patients_PatientId",
                table: "Disease",
                column: "PatientId",
                principalTable: "Patients",
                principalColumn: "Id");
        }
    }
}
