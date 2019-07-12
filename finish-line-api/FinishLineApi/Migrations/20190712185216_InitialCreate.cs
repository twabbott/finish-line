using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

namespace FinishLineApi.Migrations
{
    public partial class InitialCreate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProjectLists",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn),
                    Title = table.Column<string>(nullable: true),
                    Status = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectLists", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Projects",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn),
                    Title = table.Column<string>(nullable: true),
                    Notes = table.Column<string>(nullable: true),
                    Status = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Projects", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProjectsInProjectList",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn),
                    ProjectInProjectListId = table.Column<int>(nullable: false),
                    ProjectListId = table.Column<int>(nullable: false),
                    ProjectId = table.Column<int>(nullable: true),
                    Order = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectsInProjectList", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectsInProjectList_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReferenceItems",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn),
                    ProjectId = table.Column<int>(nullable: false),
                    Title = table.Column<string>(nullable: true),
                    Type = table.Column<string>(nullable: true),
                    Content = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReferenceItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReferenceItems_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkItems",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn),
                    Title = table.Column<string>(nullable: true),
                    Status = table.Column<string>(nullable: true),
                    ProjectId = table.Column<int>(nullable: false),
                    CreatedDate = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkItems_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LogEntries",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn),
                    ProjectId = table.Column<int>(nullable: true),
                    WorkItemId = table.Column<int>(nullable: true),
                    Title = table.Column<string>(nullable: true),
                    Content = table.Column<string>(nullable: true),
                    CreatedDate = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LogEntries_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LogEntries_WorkItems_WorkItemId",
                        column: x => x.WorkItemId,
                        principalTable: "WorkItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LogEntries_ProjectId",
                table: "LogEntries",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_LogEntries_WorkItemId",
                table: "LogEntries",
                column: "WorkItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectsInProjectList_ProjectId",
                table: "ProjectsInProjectList",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_ReferenceItems_ProjectId",
                table: "ReferenceItems",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkItems_ProjectId",
                table: "WorkItems",
                column: "ProjectId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LogEntries");

            migrationBuilder.DropTable(
                name: "ProjectLists");

            migrationBuilder.DropTable(
                name: "ProjectsInProjectList");

            migrationBuilder.DropTable(
                name: "ReferenceItems");

            migrationBuilder.DropTable(
                name: "WorkItems");

            migrationBuilder.DropTable(
                name: "Projects");
        }
    }
}
