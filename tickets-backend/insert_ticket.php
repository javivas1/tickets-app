<?php
header("Content-Type: application/json; charset=UTF-8");
require "db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(["error"=>"Método no permitido"]); exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$titulo      = trim($data["titulo"] ?? "");
$descripcion = trim($data["descripcion"] ?? "");
$prioridad   = $data["prioridad"] ?? "";

// Validaciones
if (mb_strlen($titulo) < 5)      { echo json_encode(["error"=>"El título debe tener al menos 5 caracteres."]); exit; }
if (mb_strlen($descripcion) < 10){ echo json_encode(["error"=>"La descripción debe tener al menos 10 caracteres."]); exit; }
$permitidas = ["baja","media","alta"];
if (!in_array($prioridad, $permitidas, true)) {
  echo json_encode(["error"=>"La prioridad debe ser baja | media | alta."]); exit;
}

// Insert
$stmt = $conn->prepare("INSERT INTO tickets (titulo, descripcion, prioridad) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $titulo, $descripcion, $prioridad);
if ($stmt->execute()) {
  echo json_encode(["success"=>true, "id"=>$stmt->insert_id]);
} else {
  http_response_code(500);
  echo json_encode(["error"=>"Error al crear ticket"]);
}
$stmt->close();
$conn->close();
