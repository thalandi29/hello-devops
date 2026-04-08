// This file defines your CI/CD pipeline
// Jenkins reads it automatically from your Git repo
 
pipeline {
  agent any
  // 'any' means run on the Jenkins server itself
 
  environment {
    // Your Docker Hub username — change this!
    DOCKERHUB_USERNAME = 'thalandi299'
    IMAGE_NAME         = 'hello-devops'
    // BUILD_NUMBER is automatically set by Jenkins (1, 2, 3, ...)
    IMAGE_TAG          = "${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${BUILD_NUMBER}"
    IMAGE_LATEST       = "${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest"
    // Your GitOps repo — change this!
    GITOPS_REPO        = 'https://github.com/thalandi29/hello-devops-k8s.git'
  }
 
  stages {
 
    stage('Checkout') {
      steps {
        // Jenkins automatically checks out your code
        // because the job is linked to the repo
        echo 'Checking out code...'
        checkout scm
      }
    }
 
    stage('Build Docker Image') {
      steps {
        echo "Building image: ${IMAGE_TAG}"
        sh 'docker build -t ${IMAGE_TAG} -t ${IMAGE_LATEST} .'
        // We tag with both the build number AND latest
        // build number = immutable (always points to this exact build)
        // latest = always points to most recent build
      }
    }
 
    stage('Run Tests') {
      steps {
        echo 'Running tests inside Docker container...'
        sh '''
          docker run --rm \
            -e BUILD_NUMBER=${BUILD_NUMBER} \
            ${IMAGE_TAG} \
            node test.js
        '''
        // --rm = remove container after test finishes
        // If tests fail (exit code 1), this stage fails
        // and the pipeline stops — image is NOT pushed
      }
    }
 
    stage('Push to Docker Hub') {
      steps {
        echo 'Pushing image to Docker Hub...'
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub-credentials',
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
          sh 'docker push ${IMAGE_TAG}'
          sh 'docker push ${IMAGE_LATEST}'
          sh 'docker logout'
        }
      }
    }
 
    stage('Update GitOps Repo') {
      steps {
        echo 'Updating Kubernetes manifests...'
        withCredentials([usernamePassword(
          credentialsId: 'github-credentials',
          usernameVariable: 'GIT_USER',
          passwordVariable: 'GIT_PASS'
        )]) {
          sh '''
            # Clone the GitOps repo
            rm -rf /tmp/gitops
            git clone https://${GIT_USER}:${GIT_PASS}@github.com/${GIT_USER}/hello-devops-k8s.git /tmp/gitops
            cd /tmp/gitops
            
            # Update the image tag in deployment.yaml
            sed -i "s|image: .*hello-devops:.*|image: ${IMAGE_TAG}|g" deployment.yaml
            
            # Commit and push
            git config user.email 'jenkins@ci.local'
            git config user.name 'Jenkins CI'
            git add deployment.yaml
            git commit -m "CI: Update image to build ${BUILD_NUMBER}"
            git push
            
            # Clean up
            rm -rf /tmp/gitops
          '''
        }
      }
    }
 
  }
 
  post {
    always {
      // Clean up local Docker images to save disk space
      sh 'docker rmi ${IMAGE_TAG} || true'
      sh 'docker rmi ${IMAGE_LATEST} || true'
      // '|| true' means: don't fail if image doesn't exist
    }
    success {
      echo '========================================='
      echo 'Pipeline SUCCESS!'
      echo "Image pushed: ${IMAGE_TAG}"
      echo 'ArgoCD will deploy this shortly...'
      echo '========================================='
    }
    failure {
      echo '========================================='
      echo 'Pipeline FAILED! Check the logs above.'
      echo '========================================='
    }
  }
}
