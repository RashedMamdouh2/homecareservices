using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Homecare.Migrations
{
    /// <inheritdoc />
    public partial class createthemediumtablebetweendiseaseandpatientandadddiagnosisandrecoveringdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DiseasePatient");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Disease",
                table: "Disease");

            migrationBuilder.RenameTable(
                name: "Disease",
                newName: "Diseases");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Diseases",
                table: "Diseases",
                column: "ICD");

            migrationBuilder.CreateTable(
                name: "PatientDisease",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PatientId = table.Column<int>(type: "int", nullable: false),
                    ICD = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DiagnosisDate = table.Column<DateOnly>(type: "date", nullable: false),
                    RecoverdDate = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientDisease", x => x.ID);
                    table.ForeignKey(
                        name: "FK_PatientDisease_Diseases_ICD",
                        column: x => x.ICD,
                        principalTable: "Diseases",
                        principalColumn: "ICD",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PatientDisease_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PatientDisease_ICD",
                table: "PatientDisease",
                column: "ICD");

            migrationBuilder.CreateIndex(
                name: "IX_PatientDisease_PatientId",
                table: "PatientDisease",
                column: "PatientId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PatientDisease");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Diseases",
                table: "Diseases");

            migrationBuilder.RenameTable(
                name: "Diseases",
                newName: "Disease");

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
    }
}
